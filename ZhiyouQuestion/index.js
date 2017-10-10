const exp = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookie = require('cookie-parser');
const fs = require('fs');

const app = exp();

app.use(exp.static('wwwroot'));
app.use(bodyParser.urlencoded({extended:true}));

// 解析cookie对象
app.use(cookie());

// 配置信息
var storage = multer.diskStorage({
    destination:'upload',
    filename:function(req,file,callback){
        var filename = file.originalname.split('.')
        callback(null,req.cookies.username+'.'+filename[filename.length-1])
    }
})

// 根据配置信息,创建multer对象
var upload = multer({storage})


// ---------------注册----------
app.post('/user/register',(req,res)=>{
   fs.exists('user',(exists)=>{
       if(exists){
        //   写入
        writeFile();
       }else{
           fs.mkdir('user',(error)=>{
               if(error){
                   res.status(200).json({
                       code:0,
                       msg:'用户文件创建失败'
                   })
               }else{
                //    写入
                writeFile();
               }
           })
       }
   })

//    封装一个写入的函数
  function writeFile(){
      var filename = `user/${req.body.username}.txt`;
      fs.exists(filename,(exists)=>{
            if(exists){
                // 该用户已经被注册
                res.status(200).json({
                    code:1,
                    msg:'该用户已被注册'
                })
            }else{
                req.body.ip = req.ip;
                req.body.time = Date.now();
                fs.appendFile(filename,JSON.stringify(req.body),(error)=>{
                    if(!error){
                        res.status(200).json({
                            code:2,
                            msg:'注册成功'
                        })
                    }
                })
            }
      })
  }
})

// ---------------登录---------------
app.post('/user/login',(req,res)=>{
    // 根据用户名去匹配user文件中文件
    var filename = `user/${req.body.username}.txt`;
    //  判断文件是否存在
    fs.exists(filename,(exists)=>{
        if(exists){
            // 该用户是注册，对比密码
            fs.readFile(filename,(error,data)=>{
                if(!error){
                    var user = JSON.parse(data);
                    if(user.psw == req.body.psw){
                        // 将用户名存入cookie
                         var expires = new  Date();
                         expires.setMonth(expires.getMonth()+1);
                        res.cookie('username',req.body.username,{expires});

                        // 登录成功
                        res.status(200).json({
                            code:1,
                            msg:'登录成功'
                        })

                    }else{
                        res.status(200).json({
                            code:2,
                            msg:'密码错误'
                        })
                    }
                }else{
                    res.status(200).json({
                        code:3,
                        msg:'文件读取失败'
                    })
                }
            })
        }else{
            res.status(200).json({
                code:0,
                msg:'您还未注册，请先注册'
            })
        }
    })
})

// --------------提问 ---------------

app.post('/user/ask',(req,res)=>{
    if(req.cookies.username){
        // 将获取的问题存入到question 文件夹中
        
        //封装一个写入的函数
        function writerFile(){
            // 文件的名字
            var filename = `question/${Date.now()}.txt`;
            req.body.username = req.cookies.username;
            req.body.time = Date.now();
            req.body.ip = req.ip;

            fs.writeFile(filename,JSON.stringify(req.body),(error)=>{
                if(error){
                    res.status(200).json({
                        code:2,
                        msg:'提问失败'
                    })
                }else{
                    res.status(200).json({
                        code:1,
                        msg:'提问成功'
                    })
                }
            })

        }

        fs.exists('question',(exists)=>{
            if(exists){
                // 写入
                writerFile();
            }else{
                fs.mkdir('question',(error)=>{
                    if(!error){
                        // 写入
                        writerFile();
                    }
                })
            }
        })

    }else{
        res.status(200).json({
            code:0,
            msg:'登录异常，请重新登录'
        })
        return;
    }
})

// -------------退出登录-----------
app.get('/user/out',(req,res)=>{
    res.clearCookie('username');
    res.status(200).json({
        code:1,
        msg:'退出成功'
    })
})

// ------------个人资料----------
app.post('/user/upload',upload.single('file'),(req,res)=>{
      res.status(200).json({
          msg:'图片上传成功'
      })
})

app.listen(3001,()=>{
    console.log('开启问答系统服务器··········');
})