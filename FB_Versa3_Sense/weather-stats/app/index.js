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
const conditionLabel = document.getElementById("conditionLabel");
const stepCountLabel = document.getElementById("stepCountLabel");
const batteryLabel = document.getElementById("batteryLabel");
const batteryIcon = document.getElementById("batteryIcon");

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
    const maxTextLength = 12; // TODO revise max length for final layout
    locationLabel.text = truncate(data.location, maxTextLength);

    data = units.temperature === "C" ? data : toFahrenheit(data);
    let degreeSymbol = "\u00B0";
    let lettertMarker = units.temperature === "C" ? `C` : `F`;
    
    // set values in GUI
    tempLabel.text = `${data.temperature}` + degreeSymbol + lettertMarker;
  } else {
    conditionLabel.text = "----";
    tempLabel.text = "----";
    locationLabel.text = "----";
  }
});

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