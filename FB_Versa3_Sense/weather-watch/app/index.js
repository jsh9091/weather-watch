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
  cloudyShowers,
  cloudyStorms,
  cloudyFlurries,
  cloudySnow
} from "../common/weatherConditions";

// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <svg> elements
const clockLabel = document.getElementById("clockLabel");
const amPmLabel = document.getElementById("amPmLabel");
const locationLabel = document.getElementById("locationLabel");
const tempLabel = document.getElementById("tempLabel");
const moonIcon = document.getElementById("moonIcon");
const moonPaseLabelTop = document.getElementById("moonPaseLabelTop");
const moonPaseLabelBottom = document.getElementById("moonPaseLabelBottom");
const conditionIcon = document.getElementById("conditionIcon");
const conditionLabel = document.getElementById("conditionLabel");
const stepCountLabel = document.getElementById("stepCountLabel");
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
  amPmLabel.text = rawhours >= 12 ? "PM" : "AM";
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
 * Updates the displayed weather icon.
 * @param {*} condition 
 */
function updateWeatherConditionIcon(condition) {
  switch (condition) {
    case sunny:
      conditionIcon.image = "weather-icons/yellow-sun-16526.png";
      break;
    case mostlySunny:
      conditionIcon.image = "weather-icons/yellow-sun-and-blue-cloud-16528.png";
      break;
    case partlySunny:
      conditionIcon.image = "weather-icons/yellow-sun-and-blue-cloud-16528.png";
      break;
    case someClouds:
      conditionIcon.image = "weather-icons/yellow-sun-and-blue-cloud-16528.png";
      break;
    case hazySun:
      conditionIcon.image = "weather-icons/blue-clouds-and-yellow-sun.png";
      break;
    case mostlyCloudy:
      conditionIcon.image = "weather-icons/blue-clouds-and-yellow-sun.png";
      break;
    case cloudy:
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
      break;
    case overcast:
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
      break;
    case fog:
      conditionIcon.image = "weather-icons/foggy-cloud-forecast-24549.png";
      break;
    case showers:
      conditionIcon.image = "weather-icons/downpour-rainy-day-16531.png";
      break;
    case thunderstorms:
      conditionIcon.image = "weather-icons/cloud-and-yellow-lightning.png";
      break;
    case rain:
      conditionIcon.image = "weather-icons/rainy-and-cloudy-day-16532.png";
      break;
    case flurries:
      conditionIcon.image = "weather-icons/snowfall-and-blue-cloud-16541.png";
      break;
    case snow:
      conditionIcon.image = "weather-icons/snow-and-blue-cloud-16540.png";
      break;
    case ice:
      conditionIcon.image = "weather-icons/hail-weather-and-winter-cloud.png";
      break;
    case sleet:
      conditionIcon.image = "weather-icons/hail-weather-and-winter-cloud.png";
      break;
    case freezingRain:
      conditionIcon.image = "weather-icons/hail-weather-and-winter-cloud.png";
      break;
    case rainSnow:
      conditionIcon.image = "weather-icons/hail-weather-and-winter-cloud.png";
      break;
    case hot:
      conditionIcon.image = "weather-icons/blue-thermometer-and-heat-16549.png";
      break;
    case cold:
      conditionIcon.image = "weather-icons/blue-thermometer-and-cold-16548.png";
      break;
    case windy:
      conditionIcon.image = "weather-icons/blue-wind-16544.png";
      break;
    case clearNight:
      conditionIcon.image = "weather-icons/yellow-moon-16536.png";
      break;
    case mostlyClear:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case cloudyNight:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case clouds:
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
      break;
    case hazyMoon:
      conditionIcon.image = "weather-icons/moon-and-cloudy-night-16537.png";
      break;
    case mostlyCloudy:
      conditionIcon.image = "weather-icons/blue-cloud-and-weather-16527.png";
      break;
    case cloudyShowers:
      conditionIcon.image = "weather-icons/downpour-rainy-day-16531.png";
      break;
    case cloudyStorms:
      conditionIcon.image = "weather-icons/cloud-and-yellow-lightning.png";
      break;
    case cloudyFlurries:
      conditionIcon.image = "weather-icons/snowfall-and-blue-cloud-16541.png";
      break;
    case cloudySnow:
      conditionIcon.image = "weather-icons/snowfall-and-blue-cloud-16541.png";
      break;
    default:
      conditionIcon.image = "";
  }
}

/**
* Convert temperature value to Fahrenheit
* @param {object} data WeatherData
*/
function toFahrenheit(data) {
  return Math.round((data.temperature * 1.8) + 32)
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