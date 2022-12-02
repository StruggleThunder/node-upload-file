const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require('fs');
const path = require('path');

// 设置接口的请求头
app.all("/api/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // * 表示可以跨域
    res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("X-Powered-By", "3.2.1");
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


// 设置强缓存
app.use('*', (req, res, next) => {
    res.setHeader('Cache-Control', 'max-age=10'); // 设置缓存时长 = 当前时间 + max-age；优先级比Expires高
    res.setHeader('Expires', new Date(Date.now() + 10).toUTCString()); // 兼容低版本浏览器的缓存时长
    next();
})


// 使用 body-parser 中间件，limit：支持最大上传文件的大小
app.use(bodyParser.urlencoded({ limit: "20mb", extended: false }));
app.use(bodyParser.json({ limit: "20mb" }));


// resource目录下的资源，设置可以静态访问
app.use("/resource", express.static(path.join(__dirname, "/resource")));


// 储存文件
const storageFile = multer.diskStorage({
    //设置上传后文件路径
    destination: function (req, file, cb) {
        // 要将文件保存到哪个文件夹下面
        const folderName = (req.query.folderName || 'temp').trim();
        // 保存的目录路径
        const savePath = `./resource/${folderName}`;
        // 判断目录路径是否存在，不存在就创建一个目录
        const isExists = fs.existsSync(savePath);
        if (!isExists) {
            fs.mkdir(savePath, function (err) {
                if (err) {
                    cb(null, `./resource/temp`);
                } else {
                    cb(null, savePath);
                }
            })
        } else {
            cb(null, savePath);
        }
    },
    //给上传文件重命名
    filename: function (req, file, cb) {
        const fileFormat = (file.originalname).split(".");
        const newFileName = Date.now() + "." + fileFormat[fileFormat.length - 1];
        cb(null, newFileName);
    }
});


const fileUploadAPIUrl = "/api/uploadFile";

// 此路径使用multer中间件，后面的 file 是自定义的值
app.use(fileUploadAPIUrl, multer({ storage: storageFile }).array("file"));


// 文件上传完成后，会被监听到
app.post(fileUploadAPIUrl, (req, res) => {
    const fileInfo = req.files[0];

    if (!fileInfo) {
        return res.json({
            fail: true,
            msg: "文件上传失败"
        })
    }

    return res.json({
        success: true,
        msg: "文件上传成功",
        data: {
            originalName: Buffer.from(fileInfo.originalname, "latin1").toString(
                "utf8"
            ),
            fileSize: fileInfo.size,
            filePath: '/' + fileInfo.path.replace(/\\/g, '/')
        }
    })
})


const port = 80;
app.listen(port, () => {
    console.log(`服务已启动，端口号：${port}`);
})
