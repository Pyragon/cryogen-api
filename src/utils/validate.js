const User = require('../models/User');

function validateUsername(username) {

    return {
        type: 'string',
        min: 3,
        max: 12,
        regexp: /^[a-zA-Z0-9_]+$/,
        required: true,
    };
}

function validateEmail(email) {
    //required will be false by default, can be extended when used to be true
    return {
        type: 'string',
        min: 3,
        max: 255,
        regexp: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        required: false,
    };
}

function validate(options, values) {
    if (typeof options !== 'object') return [false, 'Invalid options'];

    for (let key of Object.keys(options)) {
        let option = options[key];
        let value = values[key];
        let name = option.name || key;

        if (Array.isArray(value)) {
            if (option.type.includes('string')) {
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] !== 'string') return [false, `${name} must be an array of strings`];
                }
            }
            if (option.type.includes('number')) {
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] !== 'number') return [false, `${name} must be an array of numbers`];
                }
            }
            if (option.type.includes('boolean')) {
                for (let i = 0; i < value.length; i++) {
                    if (typeof value[i] !== 'boolean') return [false, `${name} must be an array of booleans`];
                }
            }
            let checked = [];
            for (let i = 0; i < value.length; i++) {
                let arrValue = value[i];
                if (!arrValue) continue;
                let duplicatesAllowed = !option.duplicates || option.duplicates.allowed;
                if (checked.includes(arrValue) && !duplicatesAllowed) return [false, (!option.duplicates || !option.duplicates.error) ? `${name} must not contain duplicates` : option.duplicates.error];
                checked.push(arrValue);

                if (option.regexp && !option.regexp.test(arrValue)) return [false, `${name} must match regexp ${option.regexp}`];
                if (option.min && arrValue.length < option.min) return [false, `${name} must be between ${option.min} and ${option.max} characters`];
                if (option.max && arrValue.length > option.max) return [false, `${name} must be between ${option.min} and ${option.max} characters`];

                if (option.values && !option.values.includes(arrValue))
                    return [false, `${name} is invalid`];

                if (option.validate && !option.validate(arrValue))
                    return [false, `${name} is invalid`];
            }

            if (checked.length === 0 && option.required) return [false, `${name} is required`];

            continue;
        }

        if (!value && option.required === true)
            return [false, `${name} is required`];

        if (!value) continue;

        if (option.type && typeof value !== option.type)
            return [false, `${name} must be a ${option.type}`];

        if (option.min && value.length < option.min)
            return [false, `${name} must be between ${option.min} and ${option.max} characters`];

        if (option.max && value.length > option.max)
            return [false, `${name} must be between ${option.min} and ${option.max} characters`];

        if (option.regexp && !option.regexp.test(value))
            return [false, `${name} is invalid`];

        if (option.values && !option.values.includes(value))
            return [false, `${name} is invalid`];

        if (option.validate && !option.validate(value))
            return [false, `${name} is invalid`];
    }

    return [true];
}

async function validateUsers(users, self) {
    let error;
    users = await Promise.all(users.map(async name => {
        let user = await User.findOne({ username: name });
        if (!user) {
            error = `User ${name} cannot be found`;
            return;
        }
        if (self && user._id === self._id) {
            error = 'You cannot include yourself.';
            return;
        }
        return user;
    }));
    return [error, users];
}

module.exports = { validate, validateUsername, validateEmail, validateUsers };