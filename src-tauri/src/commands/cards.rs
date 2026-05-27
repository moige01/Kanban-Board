use crate::{
    db::Db,
    error::Result,
    models::{Card, CardWithLabels, Label},
};
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCard {
    pub column_id: String,
    pub title: String,
    pub description: String,
    pub due_date: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCard {
    pub title: Option<String>,
    pub description: Option<String>,
    pub due_date: Option<Option<String>>,
}

async fn fetch_labels(db: &Db, card_id: &str) -> Result<Vec<Label>> {
    let labels = sqlx::query_as!(
        Label,
        r#"SELECT l.* FROM labels l
           JOIN card_labels cl ON cl.label_id = l.id
           WHERE cl.card_id = ?"#,
        card_id
    )
    .fetch_all(db)
    .await?;

    Ok(labels)
}

#[tauri::command]
pub async fn list_cards(db: State<'_, Db>, column_id: String) -> Result<Vec<CardWithLabels>> {
    let cards = sqlx::query_as!(
        Card,
        "SELECT * FROM cards WHERE column_id = ? AND deleted_at IS NULL ORDER BY position ASC",
        column_id
    )
    .fetch_all(db.inner())
    .await?;

    // TODO: N+1 query — fetch all labels for the column's cards in one JOIN query
    // instead of one fetch_labels() call per card.
    let mut result = Vec::with_capacity(cards.len());
    for card in cards {
        let labels = fetch_labels(db.inner(), &card.id).await?;
        result.push(CardWithLabels { card, labels });
    }

    Ok(result)
}

#[tauri::command]
pub async fn create_card(db: State<'_, Db>, payload: CreateCard) -> Result<CardWithLabels> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_pos: Option<f64> = sqlx::query_scalar!(
        "SELECT MAX(position) FROM cards WHERE column_id = ? AND deleted_at IS NULL",
        payload.column_id
    )
    .fetch_one(db.inner())
    .await?;

    let position = max_pos.map(|p| p + 1.0).unwrap_or(1.0);

    sqlx::query!(
        "INSERT INTO cards (id, column_id, title, description, due_date, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        id,
        payload.column_id,
        payload.title,
        payload.description,
        payload.due_date,
        position,
        now
    )
    .execute(db.inner())
    .await?;

    let card = sqlx::query_as!(Card, "SELECT * FROM cards WHERE id = ?", id)
        .fetch_one(db.inner())
        .await?;

    Ok(CardWithLabels { card, labels: vec![] })
}

#[tauri::command]
pub async fn update_card(
    db: State<'_, Db>,
    id: String,
    payload: UpdateCard,
) -> Result<CardWithLabels> {
    // TODO: build a single UPDATE SET clause instead of separate queries per
    // field — avoids multiple round-trips and partial-update race conditions.
    if let Some(title) = &payload.title {
        sqlx::query!("UPDATE cards SET title = ? WHERE id = ?", title, id)
            .execute(db.inner())
            .await?;
    }
    if let Some(description) = &payload.description {
        sqlx::query!("UPDATE cards SET description = ? WHERE id = ?", description, id)
            .execute(db.inner())
            .await?;
    }
    if let Some(due_date) = &payload.due_date {
        sqlx::query!("UPDATE cards SET due_date = ? WHERE id = ?", due_date, id)
            .execute(db.inner())
            .await?;
    }

    let card = sqlx::query_as!(Card, "SELECT * FROM cards WHERE id = ?", id)
        .fetch_optional(db.inner())
        .await?
        .ok_or(crate::error::AppError::NotFound)?;

    let labels = fetch_labels(db.inner(), &id).await?;

    Ok(CardWithLabels { card, labels })
}

#[tauri::command]
pub async fn move_card(
    db: State<'_, Db>,
    id: String,
    column_id: String,
    position: f64,
) -> Result<()> {
    sqlx::query!(
        "UPDATE cards SET column_id = ?, position = ? WHERE id = ?",
        column_id,
        position,
        id
    )
    .execute(db.inner())
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_card(db: State<'_, Db>, id: String) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query!("UPDATE cards SET deleted_at = ? WHERE id = ?", now, id)
        .execute(db.inner())
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn set_card_labels(
    db: State<'_, Db>,
    card_id: String,
    label_ids: Vec<String>,
) -> Result<()> {
    // TODO: diff the existing labels against label_ids and only insert/delete
    // the delta — avoids unnecessary churn and is safer under concurrent edits.
    sqlx::query!("DELETE FROM card_labels WHERE card_id = ?", card_id)
        .execute(db.inner())
        .await?;

    for label_id in &label_ids {
        sqlx::query!(
            "INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)",
            card_id,
            label_id
        )
        .execute(db.inner())
        .await?;
    }

    Ok(())
}
