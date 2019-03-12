import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

class TimelineScale extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      years: ["2000", "2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040", "2041", "2042", "2043", "2044", "2045", "2046", "2047", "2048", "2049", "2050", "2051", "2052", "2053", "2054", "2055", "2056", "2057", "2058", "2059", "2060", "2061", "2062", "2063", "2064", "2065", "2066", "2067", "2068", "2069", "2070", "2071", "2072", "2073", "2074", "2075", "2076", "2077", "2078", "2079", "2080", "2081", "2082", "2083", "2084", "2085", "2086", "2087", "2088", "2089", "2090", "2091", "2092", "2093", "2094", "2095", "2096", "2097", "2098", "2099"]
    };
  }

  getEm() {
    let initX1 = 220;
    return this.state.years.map((date, i) => {
      // let year = date.getUTCFullYear();
      let year = date;
      initX1 += 220;
      return (
        <React.Fragment key={i}>
          {this.createTicks(initX1)}
          <text x="0" y="0" fontSize="25" dy="0">
            <tspan x={initX1.toString()} y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text">{year}</tspan>
          </text>
        </React.Fragment>
      )
    })
  }

  createTicks(startingX) {
    var ticks = [];

    for (let i = 0; i <= 10; i++) {
      ticks.push(<line style={startingX > 1000 ? { display: 'none' } : { }} key={i} x1={startingX.toString()} y1="0" x2={startingX.toString()} y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>);
      startingX += 20;
    }

    return ticks;
  }

  getTimelineAxisHTML() {

    return (
      <React.Fragment>
      {/* <svg id="newDesign" height="68" width={this.props.width - 300} transform="translate(320,477)" style={{background: 'rgba(40, 40, 40, 0.70)'}} > */}
        <g>
          <line x1="0" y1="0" x2="0" y2="45" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <text x="0" y="0" fontSize="25" dy="0" style={{userSelect: 'none'}}>
            <tspan x="10" y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text">2018</tspan>
          </text>
          <React.Fragment>
            {this.getEm()}
          </React.Fragment>
          <line x1="20" y1="0" x2="20" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="40" y1="0" x2="40" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="60" y1="0" x2="60" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="80" y1="0" x2="80" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="100" y1="0" x2="100" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="120" y1="0" x2="120" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="140" y1="0" x2="140" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="160" y1="0" x2="160" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="180" y1="0" x2="180" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="200" y1="0" x2="200" y2="45" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <text x="0" y="0" fontSize="25" dy="0">
            <tspan x="210" y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text" >2019</tspan>
          </text>
          <line x1="220" y1="0" x2="220" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="240" y1="0" x2="240" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="260" y1="0" x2="260" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="280" y1="0" x2="280" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="300" y1="0" x2="300" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="320" y1="0" x2="320" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="340" y1="0" x2="340" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="360" y1="0" x2="360" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="380" y1="0" x2="380" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="400" y1="0" x2="400" y2="45" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <text x="0" y="0" fontSize="25" dy="0">
            <tspan x="410" y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text">2020</tspan>
          </text>
          <line x1="420" y1="0" x2="420" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="440" y1="0" x2="440" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="460" y1="0" x2="460" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="480" y1="0" x2="480" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="500" y1="0" x2="500" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="520" y1="0" x2="520" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="540" y1="0" x2="540" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="560" y1="0" x2="560" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="580" y1="0" x2="580" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="600" y1="0" x2="600" y2="45" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <text x="0" y="0" fontSize="25" dy="0">
            <tspan x="610" y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text">2021</tspan>
          </text>
          <line x1="620" y1="0" x2="620" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="640" y1="0" x2="640" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="660" y1="0" x2="660" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="680" y1="0" x2="680" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="700" y1="0" x2="700" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="720" y1="0" x2="720" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="740" y1="0" x2="740" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="760" y1="0" x2="760" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="780" y1="0" x2="780" y2="20" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <line x1="800" y1="0" x2="800" y2="45" className="tick-new" stroke="rgb(255,255,255)" strokeWidth="2"></line>
          <text x="0" y="0" fontSize="25" dy="0">
            <tspan x="810" y="46" dy=".6em" fill="rgb(255,255,255)" className="timeline-date-text">2022</tspan>
          </text>
          <line x1="0" y1="0" x2="776" y2="0" stroke="rgb(255,255,255)" strokeWidth="8"></line>
          </g>
        {/* </svg> */}
      </React.Fragment>
    );
  }

  render() {
    // console.log(this.props.dateArray)
    // console.log(this.props.dateArray[0].getUTCFullYear())
    return (
      <div style={{height: '2500px', width: '2100px', position: 'relative', overflow: 'auto', padding: '0'}}>
        <Draggable
          position={{ x: 300, y: 385 }}
          axis="x"
          handle="#newDesign"
        >
          <svg id="newDesign" height="68" width={this.props.width * 4} transform="translate(320,477)" style={{background: 'rgba(40, 40, 40, 0.70)'}} >
            {this.getTimelineAxisHTML()}
          </svg>
        </Draggable>
      </div>
    );
  };
}

TimelineScale.defaultProps = {
};
TimelineScale.propTypes = {
};

export default TimelineScale;
