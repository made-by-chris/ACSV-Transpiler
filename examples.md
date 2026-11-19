# ZROW examples

The [example gallery](https://zrow.majaku.com/examples/) and editor dropdown group examples into features and use cases. Every recipe uses language version 0.3. Feature entries demonstrate one construct or function; use cases combine them into a complete table.

## Enums

```zrow
# ZROW 0.4
(enum Role "member","admin","guest")
(cols id:int,role:Role)
(id=seq(),role=cycle(Role))
(rows 3)
```

```csv
id,role
1,member
2,admin
3,guest
```

## Generated and literal rows

```zrow
# ZROW 0.4
(cols id:int,name,role)
(id=seq(),name="User {id}",role=member)
(rows 2)
3,"Shelley, Chris",admin
(row)
```

```csv
id,name,role
1,User 1,member
2,User 2,member
3,"Shelley, Chris",admin
4,User 4,member
```

## Seeded data and fixed time

```zrow
# ZROW 0.4
(enum Status "trial","active","paused")
(seed "customers-v1")
(time "2026-11-19T12:00:00Z")
(cols id:int,status:Status,created_at,latitude:number,longitude:number)
(id=seq(),status=choice(Status),created_at=now())
(latitude=round(latitude(52.4,52.6),6))
(longitude=round(longitude(13.2,13.6),6))
(rows 20)
```

See the [generator reference](docs/generators.md) for reproducibility and geographic distribution rules.
