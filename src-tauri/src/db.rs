use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};
use std::fs;
use tauri::Manager;

pub type Db = SqlitePool;

pub async fn init(app: &tauri::AppHandle) -> Result<Db, sqlx::Error> {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");

    fs::create_dir_all(&app_dir).expect("failed to create app data dir");

    let db_path = app_dir.join("kanban.db");

    let opts = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
