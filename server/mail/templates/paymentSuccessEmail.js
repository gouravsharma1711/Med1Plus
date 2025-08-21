const paymentSuccessEmail=(name)=>{
    return `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Payment Successful Email</title>
            <style>
                body{
                    background-color:#ffffff;
                    font-family:Arial,sans-serif;
                    font-size:16px;
                    line-height:1.4;
                    color:#333333;
                    margin:0;
                    padding:0;
                }
                .container{
                    max-width:600px;
                    margin:0 auto;
                    padding:20px;
                    text-align:center;
                }

                .logo{
                    max-width:200px;
                    margin-bottom:20px;
                }
                .message{
                    font-size:18px;
                    font-weight:bold;
                    margin-bottom:20px;
                }
                .body{
                    font-size:16px;
                    margin-bottom:20px;
                }
                .support{
                    color:#999999;
                    font-size:14px;
                    margin-top:20px;
                }
                .highlight{
                    font-weight:bold;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <div class="message">Payment Successful Email</div>
                <div class="body">
                    <p>Dear User,</p>
                    <p>Thank you for your purchase
                    </p>
                </div>
                <div class="support">
                    If you have any questions or need further assistance,please feel free to reach at
                    <a href="mailto:info@qhault.com">info@qhault.com</a>. We are here to help!
                </div>
            </div>
        </body>
    </html>`;
}

module.exports=paymentSuccessEmail;