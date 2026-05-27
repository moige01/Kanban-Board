use crate::{db::Db, error::Result, models::Board};
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBoard {
    pub project_id: String,
    pub name: String,
}

#[tauri::command]
pub async fn list_boards(db: State<'_, Db>, project_id: String) -> Result<Vec<Board>> {
    let boards = sqlx::query_as!(
        Board,
        "SELECT * FROM boards WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        project_id
    )
    .fetch_all(db.inner())
    .await?;

    Ok(boards)
}

#[tauri::command]
pub async fn create_board(db: State<'_, Db>, payload: CreateBoard) -> Result<Board> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query!(
        "INSERT INTO boards (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
        id,
        payload.project_id,
        payload.name,
        now
    )
    .execute(db.inner())
    .await?;

    let board = sqlx::query_as!(Board, "SELECT * FROM boards WHERE id = ?", id)
        .fetch_one(db.inner())
        .await?;

    Ok(board)
}

#[tauri::command]
pub async fn update_board(db: State<'_, Db>, id: String, name: String) -> Result<Board> {
    sqlx::query!("UPDATE boards SET name = ? WHERE id = ?", name, id)
        .execute(db.inner())
        .await?;

    let board = sqlx::query_as!(Board, "SELECT * FROM boards WHERE id = ?", id)
        .fetch_optional(db.inner())
        .await?
        .ok_or(crate::error::AppError::NotFound)?;

    Ok(board)
}

#[tauri::command]
pub async fn delete_board(db: State<'_, Db>, id: String) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query!("UPDATE boards SET deleted_at = ? WHERE id = ?", now, id)
        .execute(db.inner())
        .await?;

    Ok(())
}
