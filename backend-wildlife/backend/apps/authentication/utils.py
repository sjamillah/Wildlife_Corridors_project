from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging
import threading

logger = logging.getLogger(__name__)

def _send_email_async(email, otp_code, purpose, subject, plain_message, html_message):
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"OTP email sent successfully to {email} for {purpose}")
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")

def send_otp_email(email, otp_code, purpose='verification'):
    try:
        subject_map = {
            'login': 'Your Login Code',
            'registration': 'Welcome! Verify Your Account',
            'password_reset': 'Reset Your Password',
            'email_verification': 'Verify Your Email Address',
        }
        
        subject = subject_map.get(purpose, 'Your Verification Code')
        
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #333;
            background-color: #f7f9fc;
            margin: 0;
            padding: 0;
        }}
        .email-wrapper {{
            background-color: #f7f9fc;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 580px;
            margin: 0 auto;
            background-color: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }}
        .header {{
            background: linear-gradient(135deg, #34a853 0%, #0f9d58 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            font-size: 32px;
            margin-bottom: 8px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 26px;
            font-weight: 500;
            letter-spacing: -0.5px;
        }}
        .content {{
            padding: 45px 40px;
        }}
        .greeting {{
            font-size: 20px;
            color: #1a1a1a;
            margin-bottom: 15px;
            font-weight: 500;
        }}
        .message {{
            font-size: 16px;
            color: #666;
            margin: 20px 0;
            line-height: 1.8;
        }}
        .otp-container {{
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-radius: 12px;
            padding: 35px;
            text-align: center;
            margin: 30px 0;
            border: 2px solid #34a853;
        }}
        .otp-label {{
            font-size: 14px;
            color: #555;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }}
        .otp-code {{
            font-size: 42px;
            font-weight: 700;
            color: #0f9d58;
            letter-spacing: 12px;
            font-family: 'Courier New', Courier, monospace;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }}
        .timer {{
            background-color: #fff8e1;
            border-left: 4px solid #ffa726;
            padding: 16px 20px;
            margin: 25px 0;
            border-radius: 8px;
            font-size: 15px;
        }}
        .timer-icon {{
            display: inline-block;
            margin-right: 8px;
        }}
        .info-box {{
            background-color: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            font-size: 14px;
            color: #666;
        }}
        .security-note {{
            background-color: #fff3e0;
            border: 1px solid #ffe0b2;
            border-radius: 8px;
            padding: 18px 20px;
            margin: 25px 0;
            font-size: 14px;
            color: #e65100;
        }}
        .footer {{
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }}
        .footer-brand {{
            font-size: 15px;
            color: #34a853;
            font-weight: 600;
            margin-bottom: 8px;
        }}
        .footer-tagline {{
            color: #999;
            font-size: 13px;
            margin-top: 5px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 28px;
            background-color: #34a853;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="logo">🦁</div>
                <h1>Wildlife Conservation Tracker</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hi there!</div>
                
                <p class="message">
                    Thanks for using Wildlife Tracker. To keep your account secure, we need to verify it's really you.
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">{otp_code}</div>
                </div>
                
                <div class="timer">
                    <span class="timer-icon">⏱️</span>
                    <strong>Time's ticking!</strong> This code will expire in 2 minutes for your security.
                </div>
                
                <p class="message">
                    Simply enter this code in the app to continue. It's that easy!
                </p>
                
                <div class="security-note">
                    <strong>🔒 Didn't request this code?</strong><br>
                    No problem at all! Just ignore this email and your account will remain secure. 
                    Someone may have entered your email by mistake.
                </div>
                
                <div class="info-box">
                    <strong>Need help?</strong> If you're having trouble, our support team is here to help. 
                    We're committed to making wildlife conservation accessible for everyone.
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-brand">Wildlife Conservation Tracker</div>
                <div class="footer-tagline">Protecting wildlife together, one tracker at a time 🌍</div>
            </div>
        </div>
    </div>
</body>
</html>
        """
        
        plain_message = f"""
Hi there!

Thanks for using Wildlife Tracker. To keep your account secure, we need to verify it's really you.

Your Verification Code: {otp_code}

Time's ticking! This code will expire in 2 minutes for your security.

Simply enter this code in the app to continue. It's that easy!

Didn't request this code?
No problem at all! Just ignore this email and your account will remain secure.

Need help? Our support team is here to help.

Wildlife Conservation Tracker
Protecting wildlife together, one tracker at a time
        """
        
        thread = threading.Thread(
            target=_send_email_async,
            args=(email, otp_code, purpose, subject, plain_message, html_message)
        )
        thread.daemon = True
        thread.start()
        
        return True
        
    except Exception as e:
        logger.error(f"Error preparing OTP email: {e}")
        return False

