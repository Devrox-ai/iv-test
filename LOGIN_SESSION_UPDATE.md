# Login/session update

Customer login now works as a normal returning-customer flow:
1. Customer enters mobile number.
2. If the number exists, the site asks for password.
3. If it does not exist, the customer can create an account.
4. The account is stored in MongoDB and does not need to be recreated.
5. Session data is stored in MongoDB with a 30-day rolling session.

Heroku is configured for secure proxy cookies with `trust proxy` and `secure: "auto"`.
Admin login uses the same persistent session mechanism, but admin credentials remain separate from customer accounts.
