use protocol::{
    download_to_store, get_or_create_secret, AppHandle, ReceiveOptions,
};
use iroh::endpoint::presets;
use iroh::Endpoint;
use iroh_blobs::ticket::BlobTicket;
use std::str::FromStr;

use crate::export::export_single_file_bytes;
use crate::storage::create_recv_mem_store;
use crate::types::WasmReceiveResult;

fn emit_event(app_handle: &AppHandle, event_name: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event(event_name) {
            tracing::warn!("Failed to emit event {}: {}", event_name, e);
        }
    }
}

pub async fn download_bytes(
    ticket_str: String,
    options: ReceiveOptions,
    app_handle: AppHandle,
) -> anyhow::Result<WasmReceiveResult> {
    let ticket = BlobTicket::from_str(&ticket_str)?;
    let addr = ticket.addr().clone();
    let secret_key = get_or_create_secret()?;

    let builder = Endpoint::builder(presets::Minimal)
        .alpns(vec![])
        .secret_key(secret_key)
        .relay_mode(options.relay_mode.clone().into());

    anyhow::ensure!(
        ticket.addr().relay_urls().count() > 0,
        "browser receive requires relay addresses in the ticket"
    );

    let endpoint = builder.bind().await?;
    let store = create_recv_mem_store();

    let downloaded =
        download_to_store(ticket, addr, &endpoint, store.as_ref(), &app_handle).await?;

    let (file_name, bytes) =
        export_single_file_bytes(store.as_ref(), downloaded.collection).await?;

    endpoint.close().await;
    emit_event(&app_handle, "receive-completed");

    Ok(WasmReceiveResult { file_name, bytes })
}
