<h1 align="center" style="border-bottom: none">
    <img alt="rustcost Logo" src="https://avatars.githubusercontent.com/u/233272142" width="120"><br>
    <b>rustcost-dashboard</b>
</h1>

<p align="center"> 
The official dashboard UI for <b>RustCost</b> <br>
a lightweight, Kubernetes cost monitoring and observability platform.<br>
Built with modern web technologies and optimized for speed & usability.
</p>

<div align="center">

<!-- Badges -->
<img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/rustcost/dashboard.svg">
<img alt="Docker Image Size" src="https://img.shields.io/docker/image-size/rustcost/dashboard/1.0.0">
<img alt="License: Apache-2.0" src="https://img.shields.io/badge/License-Apache--2.0-blue.svg">

</div>

---

## **Overview**

`rustcost-dashboard` provides the complete UI layer for the RustCost ecosystem.

It is responsible for:

- **Displaying Kubernetes node & GPU costs**
- **Interactive charts and real-time views**
- **Cluster-wide cost analysis**
- **Detailed per-node, per-GPU, and per-pod metrics**
- **User-friendly dashboards designed for operators & SREs**

The dashboard communicates directly with **rustcost-core** via API.

---

## **Features**

- **Real-time Cluster Cost Visualization**
- **Ultra-fast rendering (Rust backend + optimized frontend)**
- **Works with GPU exporters and Kubernetes metrics**
- **Fully containerized**
- **Installable via Helm Chart**
- **Clean, modern UI**

---

## **Deployment Options**

You can deploy the dashboard in **two ways**:

---

# 1. Deploy via Kubernetes (Helm Chart)

Recommended for production.

Helm chart:  
https://github.com/rustcost/rustcost-helmchart

The chart includes:

- Dashboard UI
- Core backend
- GPU exporters
- Pre-built visualizations

---

# **2. Standalone Docker Container**

Run locally for development or testing:

```bash
docker run -d \
  -p 8080:8080 \
  -e RUSTCOST_CORE_URL=http://localhost:9000 \
  rustcost/dashboard:latest
```

Dashboard available at:

```
http://localhost:8080
```

Docker Hub:
[https://hub.docker.com/repository/docker/rustcost/dashboard](https://hub.docker.com/repository/docker/rustcost/dashboard)

---

Target stable release milestone: **December 21**

---

## **Contributing**

We welcome:

✔ Issues
✔ Feature requests
✔ UI/UX improvements
✔ Pull requests

---

## **License**

Licensed under the **Apache License, Version 2.0**.
