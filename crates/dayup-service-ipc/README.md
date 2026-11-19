# Dayup Link service

This crate is based on Clash Verge Service IPC v2.7.7 (commit
`3ed29700b093190b5e7addcaa892e77f172af544`). The original source is available
at [clash-verge-rev/clash-verge-service-ipc](https://github.com/clash-verge-rev/clash-verge-service-ipc/tree/3ed29700b093190b5e7addcaa892e77f172af544).

Dayup Link builds both the IPC client and the privileged service from this
crate. The service registration, filesystem paths, IPC endpoints, execution
locks and approved core names use the Dayup Link namespace. Keep these names
in sync with the Tauri bundle and installer when updating this crate.

The service is distributed under the included [GNU GPL license](LICENSE).
