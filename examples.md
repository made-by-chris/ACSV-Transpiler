# Working recipes

Use ACSV mode. Each example below is compiled and compared with its expected CSV by the test suite. The same typed recipes can be exported as JSON.

## App fixtures: named exceptions

```acsv
id:int,email,role,active:bool
@expect 6
@unique id
@set id=seq(),email="user{id}@example.test"
@set role=member,active=true
@rows 3
@row email="admin@example.test",role=admin
@rows 2 with role=guest,active=false
```

```csv
id,email,role,active
1,user1@example.test,member,true
2,user2@example.test,member,true
3,user3@example.test,member,true
4,admin@example.test,admin,true
5,user5@example.test,guest,false
6,user6@example.test,guest,false
```

Check account roles and inactive access with predictable IDs. Use `@row email=""` for an explicit missing-email case; no placeholder commas are needed.

## Game progression: a curve with a boss

```acsv
level:int,enemy,hp:int,damage:int,reward:int
@expect 6
@unique level
@set level=seq(),enemy=cycle("slime","golem")
@set hp=round(100*pow(1.2,level-1))
@set damage=min(20,5+level*3),reward=level*25
@rows 3
@row enemy=guardian,hp=500,damage=30
@rows 2 with enemy=elite
```

```csv
level,enemy,hp,damage,reward
1,slime,100,8,25
2,golem,120,11,50
3,slime,144,14,75
4,guardian,500,30,100
5,elite,207,20,125
6,elite,249,20,150
```

The boss overrides HP/damage while reward follows the same formula. The progression resumes afterward; damage caps at 20 for ordinary encounters.

## Shop variants: preserve relationships

```acsv
sku,price:number,quantity:int,total:number
@unique sku
@set quantity=2,total=round(price*quantity,2)
@row sku="POTION, RED",price=12.5
@row sku=SWORD,price=99.95,quantity=3
```

```csv
sku,price,quantity,total
"POTION, RED",12.5,2,25
SWORD,99.95,3,299.85
```

Named formulas can appear before their inputs. JSON preserves the numeric types. Binary floating point is suitable for fixtures; use an exact decimal system for accounting.

## Calendar fixtures: explicit dates

```acsv
id:int,date:date,ship_date:date
@set id=seq(),date=seq("2026-01-30")
@set ship_date=formatDate(date+3d,"YYYY-MM-DD")
@rows 3
```

```csv
id,date,ship_date
1,2026-01-30,2026-02-02
2,2026-01-31,2026-02-03
3,2026-02-01,2026-02-04
```

## Irregular real data

Choose **Literal CSV** for an existing dataset or whenever there is no useful pattern to express. ACSV is not required to be smaller for every table. CSV cells such as `1+2`, `a=b`, `#urgent` and `@rows 20` remain literal in that mode.
