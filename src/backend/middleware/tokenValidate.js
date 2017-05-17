import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

module.exports = (request, response, next) => {
    if (process.env.VALIDATE !== 'enforced') {
        console.log('依目前設定系統即將跳過 jsonwebtoken 認證機制(請確認是否正確配置 \'VALIDATE=enforced\')');
        next();
    } else {
        console.log('針對 jsonwebtoken 進行認證');
        let accessToken =
            (request.body && request.body.accessToken) ||
            (request.query && request.query.accessToken) ||
            request.headers['x-access-token'];
        if (accessToken) { // if a token is found
            jwt.verify(accessToken, process.env.PASS_PHRASE, (error, decodedToken) => {
                if (error) {
                    return response.status(401).json({
                        success: false,
                        data: null,
                        message: `${response.statusCode} Unauthorized (Unauthorized Token)`
                    });
                }
                console.log('認證通過...');
                next();
            });
        } else { // if there is no token, return an error
            return response.status(403).json({
                success: false,
                data: null,
                message: `${response.statusCode} Forbidden (Lost Token)`
            });
        }
    }
};
