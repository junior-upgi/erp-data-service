# erp-data-service
node.js backend app that serve live ERP data (prefiltered).  with jsonwebtoken validation

# .env 範本

ENV=development                       <~~~~ 不須更變
PORT=xxxx                             <~~~~ 視程式要開在哪個通訊阜
MSSQL_USER=xxxxxxx                    <~~~ 伺服器端資料庫帳號 (僅需讀取權限)
MSSQL_PASSWORD=xxxxxx                 <~~~ 伺服器端資料庫密碼 (僅需讀取權限)
PASS_PHRASE=xxxxxxxxxxxxxxxxx         <~~~ 伺服器管理員自行決定
AUTHORIZED_USER=xxxxxxxxxxxxxxx       <~~~ 核准客戶端提供
AUTHORIZED_PASSWORD=xxxxxxxxxxxxxxx   <~~~ 核准客戶端提供
VALIDATE=enforced                     <~~~~ 任何其他數值，系統便跳過 token 驗證程序，請注意！

# 佈署程序
cd (專案目錄)
git clone https://github.com/junior-upgi/erp-data-service
上述 .env 檔案需自行按照範本建立於本專案根目錄，視狀況輸入需要資料
npm install
npm run start:dev:server

# 運作概念、操作方式
GET http://upgi.ddns.net:9008/erpDataService/serviceStatus 可確認伺服器是否上線

POST http://upgi.ddns.net:9008/erpDataService/getToken
    headers { "Content-Type": "application/json" }
    raw Body
    {
        "loginId": xxxxxx,  // AUTHORIZED_USER
        "password": xxxxxxx // AUTHORIZED_PASSWORD
    }
    return type
    {
        "success": true/false
        "token": { jwt token } / null
        "message": { string }
    }

GET http://upgi.ddns.net:9008/erpDataService/CUST (get an array of ERP clients registered with active sales staff)
    headers { "x-access-token": { jwt token string } }
    return type
    {
        "success": true/false
        "data": [] / null
        "message": null / {error message string}
    }

GET http://upgi.ddns.net:9008/erpDataService/CUST (get an array of ERP clients registered with active sales staff)
    headers { "x-access-token": { jwt token string } }
    return type
    {
        "success": true/false
        "data": [{
            "CUS_NO":"string", // 客戶編號
            "SNM":"string",    // 客戶簡稱
            "SAL":"string"     // 員工編號(業務人員)
        },{...},{...},...] / null
        "message": null / {error message string}
    }

GET http://upgi.ddns.net:9008/erpDataService/SALM/{員工編號=SAL_NO} (get staff info by SAL_NO)
    headers { "x-access-token": { jwt token string } }
    return type
    {
        "success": true/false
        "data": {
            "SAL_NO": "string",  // 員工編號
            "NAME": "string",    // 姓名
            "DEP": "string",     // 單位編號
            "DEP_NAME": "string" // 單位簡稱
        } / null
        "message": null / {error message string}
    }

GET http://upgi.ddns.net:9008/erpDataService/SALM (get staff list against a list of SAL_NO)
    headers {
        "x-access-token": { jwt token string },
        "Content-Type": "application/json"
    }
    raw Body
    {
        "personnelList": ["xxx","xxx","xxx",....] // 員工編號
    }
    return type
    {
        "success": true/false
        "data": [{
            "SAL_NO": "string",  // 員工編號
            "NAME": "string",    // 姓名
            "DEP": "string",     // 單位編號
            "DEP_NAME": "string" // 單位簡稱
        },{...},{...},...] / null
        "message": null / {error message string}
    }

# 注意事項
1. database host and database info is hardcoded into the program
2. serviceStatus route is a server-side template served using express-handlebar package
3. the token lasts for 24 hours
4. may need to consider put AUTHORIZED_USER/PASSWORD inside a database and encrypt
