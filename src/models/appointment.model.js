const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const appointmentSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    serviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    serviceType: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    additionalNotes: { type: String, trim: true, required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookedAt: { type: Date, default: Date.now },
    appointmentDateTime: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['Requested', 'Upcoming', 'Completed', 'Cancelled', 'No Arrival', 'Rescheduled'], 
      default: 'Requested' 
    },
    review: {
      rating: { type: Number, min: 1, max: 5 },
      title: { type: String, trim: true },
      text: { type: String, trim: true },
      date: { type: Date }
    }
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index(
  { serviceCategory: 1, appointmentDateTime: 1 },
  { unique: true }
);

appointmentSchema.plugin(toJSON);
appointmentSchema.plugin(paginate);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;