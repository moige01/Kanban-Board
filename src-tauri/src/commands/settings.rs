use crate::{db::Db, error::Result};
use tauri::State;

#[tauri::command]
pub async fn get_setting(db: State<'_, Db>, key: String) -> Result<Option<String>> {
    let value = sqlx::query_scalar!("SELECT value FROM settings WHERE key = ?", key)
        .fetch_optional(db.inner())
        .await?;

    Ok(value)
}

#[tauri::command]
pub async fn set_setting(db: State<'_, Db>, key: String, value: String) -> Result<()> {
    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        key,
        value
    )
    .execute(db.inner())
    .await?;

    Ok(())
}
