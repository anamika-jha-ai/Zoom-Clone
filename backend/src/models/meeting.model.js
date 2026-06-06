import mongoose from 'mongoose';

const meetingSchema = require('./schemas/meeting.schema');

const meetingSchema = new Schema({
    meetingId: {
        type: String,
        required: true,
    },
    userId:{
        type: String,
        required: true,
        unique: true
    },
    date:{
        type: Date,
        required: true,
        default: Date.now,
        required: true
    }
});

const Meeting = mongoose.model("Meeting", meetingSchema);

export {Meeting};