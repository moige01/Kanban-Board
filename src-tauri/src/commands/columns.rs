use crate::{db::Db, error::Result, models::Column};
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateColumn {
    pub board_id: String,
    pub name: String,
}

#[tauri::command]
pub async fn list_columns(db: State<'_, Db>, board_id: String) -> Result<Vec<Column>> {
    let columns = sqlx::query_as!(
        Column,
        "SELECT * FROM columns WHERE board_id = ? AND deleted_at IS NULL ORDER BY position ASC",
        board_id
    )
    .fetch_all(db.inner())
    .await?;

    Ok(columns)
}

#[tauri::command]
pub async fn create_column(db: State<'_, Db>, payload: CreateColumn) -> Result<Column> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_pos: Option<f64> = sqlx::query_scalar!(
        "SELECT MAX(position) FROM columns WHERE board_id = ? AND deleted_at IS NULL",
        payload.board_id
    )
    .fetch_one(db.inner())
    .await?;

    let position = max_pos.map(|p| p + 1.0).unwrap_or(1.0);

    sqlx::query!(
        "INSERT INTO columns (id, board_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)",
        id,
        payload.board_id,
        payload.name,
        position,
        now
    )
    .execute(db.inner())
    .await?;

    let column = sqlx::query_as!(Column, "SELECT * FROM columns WHERE id = ?", id)
        .fetch_one(db.inner())
        .await?;

    Ok(column)
}

#[tauri::command]
pub async fn update_column(db: State<'_, Db>, id: String, name: String) -> Result<Column> {
    sqlx::query!("UPDATE columns SET name = ? WHERE id = ?", name, id)
        .execute(db.inner())
        .await?;

    let column = sqlx::query_as!(Column, "SELECT * FROM columns WHERE id = ?", id)
        .fetch_optional(db.inner())
        .await?
        .ok_or(crate::error::AppError::NotFound)?;

    Ok(column)
}

#[tauri::command]
pub async fn move_column(db: State<'_, Db>, id: String, position: f64) -> Result<()> {
    sqlx::query!("UPDATE columns SET position = ? WHERE id = ?", position, id)
        .execute(db.inner())
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_column(db: State<'_, Db>, id: String) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query!("UPDATE columns SET deleted_at = ? WHERE id = ?", now, id)
        .execute(db.inner())
        .await?;

    Ok(())
}
