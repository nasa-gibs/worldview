// import React from 'react';
// import PropTypes from 'prop-types';
// import DateSelector from '../date-selector/date-selector';
// // import DateChangeArrows from '../timeline/timeline-controls/date-change-arrows';

// function ChartingDateSelector (props) {
//   const {
//     startDate,
//   } = props;

//   console.log(startDate);

//   // These need to be pulled in from the props appropriately!!
//   const chartingStartDate = new Date();
//   const minDate = new Date();
//   const maxDate = new Date();
//   const subDailyMode = false;

//   function onDateChange() {
//     console.log('changed');
//   }

//   return (
//     <div id="date-selector-main">
//       <DateSelector
//         idSuffix="charting"
//         date={chartingStartDate}
//         onDateChange={onDateChange}
//         minDate={minDate}
//         maxDate={maxDate}
//         subDailyMode={subDailyMode}
//         fontSize={24}
//       />
//     </div>
//   );
// }

// ChartingDateSelector.propTypes = {
//   startDate: PropTypes.object,
// };

// export default ChartingDateSelector;
