### Developer Notes

These are for maintainers (not required for normal users):

```bash
docker build --build-arg APP_NAME=rustcost-dashboard -t rustcost-dashboard .
docker tag rustcost-dashboard kimc1992/rustcost-dashboard:1.0.0-dev.4
docker push kimc1992/rustcost-dashboard:1.0.0-dev.4
```
