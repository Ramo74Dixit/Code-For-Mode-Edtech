import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';

// Custom dark-themed input for the date picker
const CustomInput = React.forwardRef(({ value, onClick, placeholder, icon: Icon = Calendar }, ref) => (
    <button
        type="button"
        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={onClick}
        ref={ref}
    >
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || placeholder || 'Select date & time'}
        </span>
    </button>
));

CustomInput.displayName = 'CustomInput';

/**
 * DateTimePicker - A popup-based calendar date & time picker.
 * 
 * @param {Date|null} selected - The selected date object
 * @param {function} onChange - Callback when date changes, receives Date object
 * @param {boolean} showTimeSelect - Whether to show time picker (default: true)
 * @param {string} dateFormat - Display format (default: "MMM d, yyyy h:mm aa")
 * @param {string} placeholderText - Placeholder when no date selected
 * @param {boolean} required - Whether field is required
 * @param {string} minDate - Minimum selectable date
 */
const DateTimePicker = ({ 
    selected, 
    onChange, 
    showTimeSelect = true, 
    dateFormat = "MMM d, yyyy h:mm aa",
    placeholderText = "Select date & time",
    required = false,
    minDate = null,
    ...rest
}) => {
    return (
        <div className="datetime-picker-wrapper">
            <DatePicker
                selected={selected}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                dateFormat={dateFormat}
                minDate={minDate}
                placeholderText={placeholderText}
                customInput={<CustomInput icon={showTimeSelect ? Calendar : Calendar} />}
                popperPlacement="bottom-start"
                showPopperArrow={false}
                required={required}
                portalId="datepicker-portal"
                {...rest}
            />
        </div>
    );
};

export default DateTimePicker;
