use crate::{db::Db, error::Result, models::Label};
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabel {
    pub project_id: String,
    pub name: String,
    pub color: String,
}

#[derive(Deserialize)]
pub struct UpdateLabel {
    pub name: Option<String>,
    pub color: Option<String>,
}

#[tauri::command]
pub async fn list_labels(db: State<'_, Db>, project_id: String) -> Result<Vec<Label>> {
    let labels = sqlx::query_as!(
        Label,
        "SELECT * FROM labels WHERE project_id = ? ORDER BY name ASC",
        project_id
    )
    .fetch_all(db.inner())
    .await?;

    Ok(labels)
}

#[tauri::command]
pub async fn create_label(db: State<'_, Db>, payload: CreateLabel) -> Result<Label> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query!(
        "INSERT INTO labels (id, project_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)",
        id,
        payload.project_id,
        payload.name,
        payload.color,
        now
    )
    .execute(db.inner())
    .await?;

    let label = sqlx::query_as!(Label, "SELECT * FROM labels WHERE id = ?", id)
        .fetch_one(db.inner())
        .await?;

    Ok(label)
}

#[tauri::command]
pub async fn update_label(db: State<'_, Db>, id: String, payload: UpdateLabel) -> Result<Label> {
    if let Some(name) = &payload.name {
        sqlx::query!("UPDATE labels SET name = ? WHERE id = ?", name, id)
            .execute(db.inner())
            .await?;
    }
    if let Some(color) = &payload.color {
        sqlx::query!("UPDATE labels SET color = ? WHERE id = ?", color, id)
            .execute(db.inner())
            .await?;
    }

    let label = sqlx::query_as!(Label, "SELECT * FROM labels WHERE id = ?", id)
        .fetch_optional(db.inner())
        .await?
        .ok_or(crate::error::AppError::NotFound)?;

    Ok(label)
}

#[tauri::command]
pub async fn delete_label(db: State<'_, Db>, id: String) -> Result<()> {
    sqlx::query!("DELETE FROM labels WHERE id = ?", id)
        .execute(db.inner())
        .await?;

    Ok(())
}
