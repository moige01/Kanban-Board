use crate::{db::Db, error::Result, models::Project};
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateProject {
    pub name: String,
    pub description: String,
}

#[derive(Deserialize)]
pub struct UpdateProject {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[tauri::command]
pub async fn list_projects(db: State<'_, Db>) -> Result<Vec<Project>> {
    let projects = sqlx::query_as!(
        Project,
        "SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at ASC"
    )
    .fetch_all(db.inner())
    .await?;

    Ok(projects)
}

#[tauri::command]
pub async fn create_project(db: State<'_, Db>, payload: CreateProject) -> Result<Project> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query!(
        "INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        id,
        payload.name,
        payload.description,
        now
    )
    .execute(db.inner())
    .await?;

    let project = sqlx::query_as!(Project, "SELECT * FROM projects WHERE id = ?", id)
        .fetch_one(db.inner())
        .await?;

    Ok(project)
}

#[tauri::command]
pub async fn update_project(
    db: State<'_, Db>,
    id: String,
    payload: UpdateProject,
) -> Result<Project> {
    if let Some(name) = &payload.name {
        sqlx::query!("UPDATE projects SET name = ? WHERE id = ?", name, id)
            .execute(db.inner())
            .await?;
    }
    if let Some(description) = &payload.description {
        sqlx::query!(
            "UPDATE projects SET description = ? WHERE id = ?",
            description,
            id
        )
        .execute(db.inner())
        .await?;
    }

    let project = sqlx::query_as!(Project, "SELECT * FROM projects WHERE id = ?", id)
        .fetch_optional(db.inner())
        .await?
        .ok_or(crate::error::AppError::NotFound)?;

    Ok(project)
}

#[tauri::command]
pub async fn delete_project(db: State<'_, Db>, id: String) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query!(
        "UPDATE projects SET deleted_at = ? WHERE id = ?",
        now,
        id
    )
    .execute(db.inner())
    .await?;

    Ok(())
}
