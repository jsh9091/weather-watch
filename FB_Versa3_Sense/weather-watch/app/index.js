/*
 * MIT License
 *
 * Copyright (c) 2026 Joshua Horvath
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import document from "document";
import clock from "clock";
import { preferences, units } from "user-settings";
import { me as appbit } from "appbit";
import { today as activity } from "user-activity";
import { battery } from "power";
import * as newfile from "./newfile";
import * as moon from "./lunarcalculator";
import {
  sunny,
  mostlySunny,
  partlySunny,
  someClouds,
  hazySun,
  mostlyCloudy,
  cloudy,
  overcast,
  fog,
  showers,
  thunderstorms,
  rain,
  flurries,
  snow,
  ice,
  sleet,
  freezingRain,
  rainSnow,
  hot,
  cold,
  windy,
  clearNight,
  mostlyClear,
  cloudyNight,
  clouds,
  hazyMoon,
  mostlyCloudyNight,
  cloudyShowers,
  cloudyStorms,
  cloudyFlurries,
  cloudySnow
} from "../common/weatherConditions";
import * as simpleSettings from "./simple/device-settings";

let color = "white";

// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <svg> elements
const amLabel = document.getElementById("amLabel");
const clockLabel = document.getElementById("clockLabel");
const pmLabel = document.getElementById("pmLabel");
const locationLabel = document.getElementById("locationLabel");
const tempLabel = document.getElementById("tempLabel");
const moonIcon = document.getElementById("moonIcon");
const moonPaseLabelTop = document.getElementById("moonPaseLabelTop");
const moonPaseLabelBottom = document.getElementById("moonPaseLabelBottom");
const conditionIcon = document.getElementById("conditionIcon");
const conditionLabel = document.getElementById("conditionLabel");
const stepCountLabel = document.getElementById("stepCountLabel");
const stepsIcon = document.getElementById("stepsIcon");
const batteryLabel = document.getElementById("batteryLabel");
const batteryIcon = document.getElementById("batteryIcon");
const dateLabel = document.getElementById("dateLabel");

/**
 * Update the display of clock values.
 * @param {*} evt 
 */
clock.ontick = (evt) => {
    updateTimeDisplay(evt);

    let todayDate = evt.date;
    updatePhaseIcon(todayDate);
    updatePhaseLabel(todayDate);

    // handle case of user permission for step counts is not there
    if (appbit.permissions.granted("access_activity")) {
        stepCountLabel.text = getSteps().formatted;
    } else {
        stepCountLabel.text = "-----";
    }

    updateBattery();

    updateDate(todayDate);
};

/**
 * Gets and formats user step count for the day.
 * @returns 
 */
function getSteps() {
  let val = activity.adjusted.steps || 0;
  return {
    raw: val,
    formatted:
      val > 999
        ? `${Math.floor(val / 1000)},${("00" + (val % 1000)).slice(-3)}`
        : val,
  };
}

/**
 * Updates display of time information. 
 * @param {*} evt 
 */
function updateTimeDisplay(evt) {
  // get time information from API
  let todayDate = evt.date;
  let rawhours = todayDate.getHours();
  let hours = rawhours;

  if (preferences.clockDisplay === "12h") {
    // 12 hour format
    hours = hours % 12 || 12;
  } else {
    // 24 hour format
    hours = zeroPad(hours);
  }

  let mins = todayDate.getMinutes();
  let displayMins = zeroPad(mins);

  // display time on main clock
  clockLabel.text = `${hours}:${displayMins}`;

  // AM / PM indicator
  if (rawhours >= 12) {
      pmLabel.text = "PM";
      amLabel.text = "";
  } else {
      amLabel.text = "AM";
      pmLabel.text = "";
  }
}

/**
 * Front appends a zero to an integer if less than ten.
 * @param {*} i 
 * @returns 
 */
function zeroPad(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

/**
 * Update the displayed battery level. 
 * @param {*} charger 
 * @param {*} evt 
 */
battery.onchange = (charger, evt) => {
  updateBattery();
};

/**
 * Updates the battery battery icon and label.
 */
function updateBattery() {
  updateBatteryLabel();
  updateBatteryIcon();
}

/**
 * Updates the battery lable GUI for battery percentage. 
 */
function updateBatteryLabel() {
  let percentSign = "&#x25";
  batteryLabel.text = battery.chargeLevel + percentSign;
}

/**
 * Updates what battery icon is displayed. 
 */
function updateBatteryIcon() {
  const minFull = 70;
  const minHalf = 30;
  
  if (battery.charging) {
    batteryIcon.image = "battery-charging.png"
  } else if (battery.chargeLevel > minFull) {
    batteryIcon.image = "battery-full.png"
  } else if (battery.chargeLevel < minFull && battery.chargeLevel > minHalf) {
    batteryIcon.image = "battery-half.png"
  } else if (battery.chargeLevel < minHalf) {
    batteryIcon.image = "battery-low.png"
  }
}

/**
 * Receive and process new tempature data.
 */
newfile.initialize((data) => {
  // fresh weather file received
  if (appbit.permissions.granted("access_location")) {

    conditionLabel.text = `${data.condition}`;
    
    const maxTextLength = 15;
    locationLabel.text = truncate(data.location, maxTextLength);

    data = units.temperature === "C" ? data : toFahrenheit(data);
    let degreeSymbol = "\u00B0";
    let lettertMarker = units.temperature === "C" ? `C` : `F`;
    
    // set values in GUI
    tempLabel.text = `${data.temperature}` + degreeSymbol + lettertMarker;

    updateWeatherConditionIcon(data.condition);

  } else {
    conditionLabel.text = "----";
    tempLabel.text = "----";
    locationLabel.text = "----";
    conditionIcon.image = "";
  }
});

/**
* Convert temperature value to Fahrenheit
* @param {object} data WeatherData
*/
function toFahrenheit(data) {
  if (data.unit.toLowerCase() === "celsius") {
     data.temperature =  Math.round((data.temperature * 1.8) + 32);
     data.unit = "Fahrenheit";
  }
  return data
}

/**
 * Updates the displayed weather icon.
 * @param {*} condition 
 */
function updateWeatherConditionIcon(condition) {
  resetConditionStyles();

  switch (condition) {
    case sunny:
      conditionIcon.x = 256;
      conditionIcon.y = 148;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/yellow-sun-16526.png";
      break;
    case mostlySunny:
    case partlySunny:
    case someClouds:
      conditionIcon.image = "weather-icons/yellow-sun-and-blue-cloud-16528.png";
      break;
    case hazySun:
    case mostlyCloudy:
      conditionIcon.image = "weather-icons/blue-clouds-and-yellow-sun.png";
      break;
    case cloudy:
      conditionIcon.x = 242;
      conditionIcon.y = 140;
      conditionIcon.width = 68;
      conditionIcon.height = 68;
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
    case overcast:
      conditionIcon.x = 242;
      conditionIcon.y = 143;
      conditionIcon.width = 68;
      conditionIcon.height = 68;
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
      break;
    case fog:
      conditionIcon.x = 261;
      conditionIcon.y = 149;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/foggy-cloud-forecast-24549.png";
      break;
    case showers:
      conditionIcon.x = 254;
      conditionIcon.y = 148;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/downpour-rainy-day-16531.png";
      break;
    case thunderstorms:
      conditionIcon.x = 240;
      conditionIcon.y = 146;
      conditionIcon.width = 64;
      conditionIcon.height = 64;
      conditionIcon.image = "weather-icons/cloud-and-yellow-lightning.png";
      break;
    case rain:
      conditionIcon.x = 261;
      conditionIcon.y = 149;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/rainy-and-cloudy-day-16532.png";
      break;
    case flurries:
      conditionIcon.x = 245;
      conditionIcon.y = 148;
      conditionIcon.width = 58;
      conditionIcon.height = 58;
      conditionIcon.image = "weather-icons/snowfall-and-blue-cloud-16541.png";
      break;
    case snow:
      conditionIcon.x = 259;
      conditionIcon.y = 149;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/snow-and-blue-cloud-16540.png";
      break;
    case ice:
      conditionIcon.x = 264;
      conditionIcon.y = 147;
      // Ice cube icon: https://icons8.com/icon/cv69cLhUJ64O/ice
      conditionIcon.image = "weather-icons/ice-cube.png";
      break;
    case sleet:
    case freezingRain:
    case rainSnow:
      conditionIcon.x = 262;
      conditionIcon.y = 149;
      conditionIcon.width = 53;
      conditionIcon.height = 53;
      conditionIcon.image = "weather-icons/hail-weather-and-winter-cloud.png";
      break;
    case hot:
      conditionIcon.x = 268;
      conditionIcon.y = 150;
      conditionIcon.width = 53;
      conditionIcon.height = 53;
      conditionIcon.image = "weather-icons/blue-thermometer-and-heat-16549.png";
      break;
    case cold:
      conditionIcon.x = 262;
      conditionIcon.y = 150;
      conditionIcon.width = 53;
      conditionIcon.height = 53;
      conditionIcon.image = "weather-icons/blue-thermometer-and-cold-16548.png";
      break;
    case windy:
      conditionIcon.x = 252;
      conditionIcon.y = 146;
      conditionIcon.image = "weather-icons/blue-wind-16544.png";
      break;
    case clearNight:
      conditionIcon.x = 260;
      conditionIcon.y = 152;
      conditionIcon.width = 45;
      conditionIcon.height = 45;
      conditionIcon.image = "weather-icons/yellow-moon-16536.png";
      break;
    case mostlyClear:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case cloudyNight:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case clouds:
      conditionIcon.x = 250;
      conditionIcon.y = 146;
      conditionIcon.image = "weather-icons/blue-clouds-and-blue-moon.png";
      break;
    case hazyMoon:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case mostlyCloudyNight:
      conditionLabel.x = 316;
      conditionLabel.y = 239;
      conditionLabel.style.fontSize = 33;
      conditionIcon.y = 149;
      conditionIcon.image = "weather-icons/blue-clouds-and-blue-moon.png";
      break;
    case cloudyShowers:
      conditionIcon.x = 250;
      conditionIcon.y = 150;
      conditionIcon.width = 55;
      conditionIcon.height = 55;
      conditionIcon.image = "weather-icons/downpour-rainy-day-16531.png";
      break;
    case cloudyStorms:
      conditionIcon.y = 150;
      conditionIcon.image = "weather-icons/cloud-and-yellow-lightning.png";
      break;
    case cloudyFlurries:
    case cloudySnow:
      conditionIcon.x = 245;
      conditionIcon.y = 148;
      conditionIcon.width = 58;
      conditionIcon.height = 58;
      conditionIcon.image = "weather-icons/snowfall-and-blue-cloud-16541.png";
      break;
    default:
      conditionIcon.image = "";
  }
}

/**
 * Resets default styles for weather condition icon.
 */
function resetConditionStyles() {
  conditionLabel.x = 312;
  conditionLabel.y = 239;
  conditionLabel.style.fontSize = 38;
  conditionIcon.x = 245;
  conditionIcon.y = 144;
  conditionIcon.width = 60;
  conditionIcon.height = 60;
}

/**
 * Checks if the length of a string is longer than the given integer. 
 * If the length is longer, then the string is truncated.
 * @param {*} text 
 * @param {*} length 
 * @returns string
 */
function truncate(text, length) {
  if (text.length > length) {
    let ellipsis = '\u2026';
    text = text.substring(0, length) + ellipsis;
  }
  return text;
}

/**
 * Updates the moon phase icon image. 
 * @param {*} date 
 */
function updatePhaseIcon(date) {
    const phase = moon.getLunarPhase(date);

    switch (phase) {
        case moon.newMoon:
            moonIcon.image = "moon/new-moon.png";
        break;
        case moon.waxingCrescent:
            moonIcon.image = "moon/waxing-cresent.png";
        break;
        case moon.firstQuarter:
            moonIcon.image = "moon/first-quarter.png";
        break;
        case moon.waxingGibbous:
            moonIcon.image = "moon/waxing-gibbous.png";
        break;
        case moon.fullMoon:
            moonIcon.image = "moon/full-moon.png";
        break;
        case moon.waningGibbous:
            moonIcon.image = "moon/waning-gibbous.png";
        break;
        case moon.lastQuarter:
            moonIcon.image = "moon/last-quarter.png";
        break;
        case moon.waningCrescent:
            moonIcon.image = "moon/waning-cresent.png";
        break;
        default: 
            // something went wrong
            moonIcon.image = "";
    }
}
/**
 * Displays text of lunar phase. 
 * @param {*} date 
 */
function updatePhaseLabel(date) {
    const phase = moon.getLunarPhase(date);
    const words = phase.split(' ');

    moonPaseLabelTop.text = words[0];
    moonPaseLabelBottom.text = words[1];
}

/**
 * Updates date information displayed. 
 * @param {*} todayDate 
 */
function updateDate(todayDate) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[todayDate.getMonth()];
  const dayOfMonth = todayDate.getDate();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const index = todayDate.getDay();
  const dayName = dayNames[index];

  dateLabel.text = dayName + " " + month + " " + dayOfMonth;
}

/**
 * Get and process settings changes.
 * @param {*} data 
 * @returns 
 */
function settingsCallback(data) {
  if (!data) {
    return;
  }

  if (data.color) {
    color = data.color;
    setColor();
  }

}
simpleSettings.initialize(settingsCallback);

/**
 * Sets display elements to current color.
 */
function setColor() {
  clockLabel.style.fill = color;
  amLabel.style.fill = color;
  pmLabel.style.fill = color;
  stepCountLabel.style.fill = color;
  stepsIcon.style.fill = color;
  batteryLabel.style.fill = color;
  batteryIcon.style.fill = color;
  dateLabel.style.fill = color;
}