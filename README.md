# RustCost Dashboard

This repository contains the **dashboard** of [RustCost](https://github.com/rustcost/rustcost-helmchart), a lightweight Kubernetes-native cost monitoring and observability platform.
The dashboard is built with **React + Vite + Tailwind**, and designed to be deployed alongside the RustCost backend using Docker and Helm.

---

### Developer Notes

These are for maintainers (not required for normal users):

```bash
docker build --build-arg APP_NAME=rustcost-dashboard -t rustcost-dashboard .
docker tag rustcost-dashboard kimc1992/rustcost-dashboard:1.0.0-dev.4
docker push kimc1992/rustcost-dashboard:1.0.0-dev.4
```
