import httpStatus from 'http-status';
import { User } from '../models/users.model.js';
import bcrypt, { hash } from 'bcrypt';
import { Cipheriv } from 'crypto';
import crypto from 'crypto';

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Username and password are required' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
        }
        if (bcrypt.compare(password, user.password)) {
            let token = crypto.randomBytes(20).toString('hex');
            user.token = token;
            await user.save();

            return res.status(httpStatus.OK).json({ token: token });

        }
    } catch(error){
    console.error(error);

    res.status(500).json({
        message: "Error logging in",
        error: error.message
    });
}
}

const register = async (req, res) => {
    const { name, username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();

        res.status(httpStatus.CREATED).json({ message: 'User registered successfully' });

    } catch(error){
    console.log(error);

    res.status(500).json({
        message: "Error registering user",
        error: error.message
    });
}

}
export{login,register};