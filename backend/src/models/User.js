const mongoose = require('mongoose');
const bcrypt  = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
    },
        password:{
            type:String,
            required:true,
            minlength:6
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
});

userSchema.pre('save',async function(next){
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);