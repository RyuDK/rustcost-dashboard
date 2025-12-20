### Developer Notes

These are for maintainers (not required for normal users):

```bash
docker build --build-arg APP_NAME=rustcost-dashboard -t rustcost-dashboard .
docker tag rustcost-dashboard rustcost/dashboard:1.0.0
docker push rustcost/dashboard:1.0.0
```
