function sendRecoveryEmail(user, code) {

    let email = {
        from: 'no-reply@cryogen-rsps.com',
        to: user.email,
        subject: 'Cryogen - Recover your Account',

    }

}

module.exports = { sendRecoveryEmail };