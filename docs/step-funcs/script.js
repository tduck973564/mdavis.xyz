function byId(id){
  return document.getElementById(id);
}

// set up events for validating/warning about user input
// and triggering evaluations
window.addEventListener("load", function(){
  console.log("Setting up event listeners");
  // Input field
  setupJsonWarning("Input", "InvalidInputWarning");
  setupEval("Input");

  // InputPath field
  setupEval("InputPath");
  setupEval("InputPathEnabled");
  setupNullWarning("InputPath", "NullInputPathWarning")
  setupDollarStartWarning("InputPath", "InputPathStartDollarWarn");
  setupToggleHide("InputPathEnabled", "InputPathExtras");
  setupIntrinsicFuncWarn("InputPath", "InputPathFuncWarn");

  // Parameters
  setupEval("Parameters");
  setupEval("ParametersEnabled");
  setupJsonWarning("Parameters", "InvalidParametersWarning");
  setupToggleHide("ParametersEnabled", "ParametersExtras");
  setupNullWarning("Parameters", "NullParametersWarning")
  setupIntrinsicFuncWarn("Parameters", "ParametersFuncWarn");

  // Result
  setupEval("Result");
  setupEval("ResultEnabled");
  setupJsonWarning("Result", "InvalidResultWarning");
  setupToggleHide("ResultEnabled", "ResultExtras", "WhenNoResult");
  setupNullWarning("Result", "NullResultWarning");
  setupDollarWarning("Result", "ResultDollarWarning");
  setupIntrinsicFuncWarn("Result", "ResultFuncWarn");

  // ResultSelector
  setupEval("ResultSelector");
  setupEval("ResultSelectorEnabled");
  setupJsonWarning("ResultSelector", "InvalidResultSelectorWarning");
  setupToggleHide("ResultSelectorEnabled", "ResultSelectorExtras");
  setupNullWarning("ResultSelector", "NullResultSelectorWarning");
  setupIntrinsicFuncWarn("ResultSelector", "ResultSelectorFuncWarn");

  // ResultPath
  setupEval("ResultPath");
  setupEval("ResultPathEnabled");
  setupToggleHide("ResultPathEnabled", "ResultPathExtras");
  setupNullWarning("ResultPath", "NullResultPathWarning");
  setupIntrinsicFuncWarn("ResultPath", "ResultPathFuncWarn");
  setupDollarStartWarning("ResultPath", "ResultPathStartDollarWarn");

  // OutputPath
  setupEval("OutputPath");
  setupEval("OutputPathEnabled");
  setupToggleHide("OutputPathEnabled", "OutputPathExtras");
  setupNullWarning("OutputPath", "NullOutputPathWarning");
  setupIntrinsicFuncWarn("OutputPath", "OutputPathFuncWarn");
  setupDollarStartWarning("OutputPath", "OutputPathStartDollarWarn");

  console.log("Event listener setup complete");

});


// set up event handlers
// so when you change the tickbox/text field with id,
// the evaluation is automatically run
setupEval = function(id){
  byId(id).addEventListener("input", evalAll);
}

// w is the ID of a DOM element to hide/show
// if the innerText of the el with id txt is invalid JSON
setupJsonWarning = function(txt_id, w_id){
  byId(txt_id).addEventListener("input", function(){
    v = byId(txt_id).innerText;
    w_el = byId(w_id);
    try {
      d = JSON.parse(v);
      w_el.style.display = "none";
    }catch(e){
      w_el.style.display = "block";
    }
  })
}

// w is the ID of a DOM element to hide/show
// if the innerText of the el with id txt is "null"
setupNullWarning = function(txt_id, w_id){
  byId(txt_id).addEventListener("input", function(){
    w_el = byId(w_id)
    if (byId(txt_id).innerText.trim() === "null"){
      w_el.style.display = "block";
    }else{
      w_el.style.display = "none";
    };
  });
}

// w is the ID of a DOM element to hide/show
// if the innerText of the el with id txt
// contains "$"
setupDollarWarning = function(txt_id, w_id){
  byId(txt_id).addEventListener("input", function(){
    val = byId(txt_id).innerText.trim();
    w_el = byId(w_id);
    if (val.startsWith('$')){
      w_el.style.display = "block";
    }else if(val == "null"){
      // special case
      // the next else branch doesn't handle this correctly
      // not sure why
      w_el.style.display = "none";
    }else{
      // what if the Result is like {"a.$": "$"}
      // to check this, apply JSONPath recursively
      // and check whether the result is different to the input (or undefined)
      try {
        r = JSON.parse(val);
        return;
      }catch(e){
        console.log("I think the result is not valid JSON");
        w_el.style.display = "none";
        // there's an invalid JSON warning handled elsewhere
        // this function is just about $
      }
      try {
        after = recursivePath(r, {"fake-random-data-mdavis-xyz": 123098})
        // need to parse val again
        // since recursivePath modifies it
        r = JSON.parse(val);

        // checking if after != r is tricky
        // in Javascript, {} != {}

        if ((after == undefined) || (JSON.stringify(after) != JSON.stringify(r))){
          console.log("I think result includes .$");
          w_el.style.display = "block";
        }else{
          console.log("I think the result is valid json and does not include .$")
          w_el.style.display = "none";
        }
      }catch(e){
        // probably some kind of .$ inside which isn't correct
        // so show the .$ warning
        w_el.style.display = "block";
      }
    }
  })
}

// set up event listeners
// to hide/show warning about
// how a field must start with a $
// (unless it equals $)
setupDollarStartWarning = function(txt_id, w_id){
  byId(txt_id).addEventListener("input", function(){
    w_el = byId(w_id);
    v = byId(txt_id).innerText.trim();
    if (v.startsWith("$") || (v == "null")){
      w_el.style.display = "none";
    }else{
      w_el.style.display = "block";
    }
  })
}

// set up event handlers
// so when you tick/untick the "enable x" box,
// the relevant fields are shown/hidden
// extras is only shown when the box is ticked
// when_none is optional, shown only when the box is unticked
setupToggleHide = function(checkbox_id, extras_id, when_none){
  byId(checkbox_id).addEventListener("input", function(){
    if (byId(checkbox_id).checked){
      console.log(`showing ${extras_id}`);
      // show
      byId(extras_id).style.display = "block";
      if (when_none != undefined){
        byId(when_none).style.display = "none";
      }
    }else{
      // hide
      console.log(`hiding ${extras_id}`);
      byId(extras_id).style.display = "none";
      if (when_none != undefined){
        byId(when_none).style.display = "block";
      }
    }
  });
  evalAll();
}

// sets up event handlers
// to show warnings if user tries to use an intrinsic function
// which we don't support here
setupIntrinsicFuncWarn = function(txt_id, warn_id){
  byId(txt_id).addEventListener("input", function(){
    // https://states-language.net/spec.html#appendix-b
    intrinsic_funcs = ["States.Format", "States.StringToJson", "States.JsonToString", "States.Array"];
    v = byId(txt_id).innerText.toLowerCase();
    w_el = byId(warn_id);
    in_val = function(f){
      return (v.toLowerCase().includes(f.toLowerCase()))
    };
    if (intrinsic_funcs.some(in_val)){
      w_el.style.display = "block";
    }else{
      w_el.style.display = "none";
    }
  })
}




// return [obj, err]
// if valid input path and valid input
// obj is a dict/list/obj after the InputPath is applied
// or err is a string of an error to show to the user
function evalInputPath(){
  inputEl = byId("Input");
  try {
    inputObj = JSON.parse(inputEl.innerText);
  } catch (e) {
    console.log(e);
    console.log("Input probably not valid JSON");
    return [undefined, "Input is invalid JSON"];
  };

  pathVal = byId("InputPath").innerText;
  if (! byId("InputPathEnabled").checked){
    console.log("Skipping InputPath")
    obj = inputObj; // no InputPath
  }else if (pathVal.trim() === "null") {
    // special meaning in step functions
    obj = {};
  } else {
    try {
      console.log(`Applying jsonPath(${inputObj}, "${pathVal}")`);
      obj = applyPath(inputObj, pathVal);
    } catch(e) {
      console.log(e)
      return [undefined, "Invalid InputPath"];
    }
  }
  if (obj == undefined){
      return [undefined, "Invalid InputPath"];
  }

  console.log("InputPath applied successfully");
  return [obj, undefined];
}

// returns [afterParametersObj, err2]
// input obj is the object after InputPath
// output object is after parameters have been applied
// input err is the error from any previous path (e.g. InputPath)
function evalParameters(afterInputPathobj, err){
    if (err){
      return [undefined, err];
    }
    try {
      paramsObj = JSON.parse(byId("Parameters").innerText);
    } catch (e) {
      console.log(e);
      return [undefined, "Parameters is invalid json"];
    };

    if (! byId("ParametersEnabled").checked){
      console.log("Skipping Parameters");
          }else if (paramsObj == null) {
      // special meaning in step functions
      obj = {};
    }else {
      try {
        obj = recursivePath(paramsObj, obj);
      } catch(e) {
        console.log(e);
        return [undefined, "Invalid Parameters"];
      }
    }
    return [obj, undefined];
}

function evalTheResult(afterParametersObj, err){
  if (byId("ResultEnabled").checked){
    // use the result
    // even if prior steps failed
    try {
      obj = JSON.parse(byId("Result").innerText);
      return [obj, undefined];
    } catch (e) {
      console.log(e);
      return [undefined, "Result is invalid JSON"];
    };
  }else if (err){
    return [undefined, err]
  }else{
    return [afterParametersObj, err];
  }
}

function evalResultSelector(afterResult, err){
    if (err){
      return [undefined, err];
    }
    try {
      resultSelectorObj = JSON.parse(byId("ResultSelector").innerText);
    } catch (e) {
      console.log(e);
      return [undefined, "ResultSelector is invalid json"];
    };

    if (! byId("ResultSelectorEnabled").checked){
      console.log("Skipping ResultSelector");
      return [afterResult, undefined];
    }else if (resultSelectorObj == null) {
      // special meaning in step functions
      obj = {};
    }else {
      try {
        obj = recursivePath(resultSelectorObj, obj);
      } catch(e) {
        console.log(e);
        return [undefined, "Invalid ResultSelector"];
      }
    }
    return [obj, undefined];
}


function evalOutputPath(afterResultPathObj, err){
  if (err){
    return [undefined, err];
  }else{
    pathVal = byId("OutputPath").innerText;
    if (! byId("OutputPathEnabled").checked){
      console.log("Skipping InputPath")
      return [afterResultPathObj, undefined];
    }else if (pathVal.trim() === "null") {
      // special meaning in step functions
      obj = {};
    } else {
      try {
        obj = applyPath(afterResultPathObj, pathVal);
      } catch(e) {
        console.log(e)
        return [undefined, "Invalid OutputPath"];
      }
    }
    if (obj == undefined){
        return [undefined, "Invalid OutputPath"];
    }
    return [obj, undefined];
  }

}


function evalAll(){
  // Apply InputPath
  [obj, err] = evalInputPath();
  byId("AfterInputPath").innerText = err ? "Error: " + err : JSON.stringify(obj, null, 4);

  // apply Parameters
  [obj, err] = evalParameters(obj, err);
  byId("AfterParameters").innerText = err ? "Error: " + err : JSON.stringify(obj, null, 4);

  // apply result
  [obj, err] = evalTheResult(obj, err);
  // there's no field to show an error/intermediate value in

  // apply ResultSelector
  [obj, err] = evalResultSelector(obj, err);
  byId("AfterResultSelector").innerText = err ? "Error: " + err : JSON.stringify(obj, null, 4);

  // apply ResultPath
  // TODO
  byId("AfterResultPath").innerText = err ? "Error: " + err : "Not yet implemented";

  // apply OutputPath
  [obj, err] = evalOutputPath(obj, err);
  byId("AfterOutputPath").innerText = err ? "Error: " + err : JSON.stringify(obj, null, 4);

}

  // // step 3: apply Parameters
  // if (byId("NoParameters").checked) {
  //   // no Parameters field
  //   // so just pass through whatever happened after InputPath
  //   byId("AfterParameters").innerText = byId("AfterInputPath").innerText;
  //   afterParametersObj = obj;
  // }else if (byId("ParametersWith").checked){
  //   parametersVal = byId("Parameters").innerText;
  //   try {
  //     afterParametersObj = applyPath(obj, parametersVal);
  //   } catch (e) {
  //     console.log(e);
  //     console.log("Failed to apply parameters");
  //     byId("AfterParameters").innerText = "Error applying Parameters field";
  //     // TODO: set subsequent fields to errors too
  //     return;
  //   }
  // }
  // // step 4: apply Result
  // if (byId("NoResult").checked) {
  //   afterResultObj = afterParametersObj;
  // }else if (byId("ResultWithout").checked){
  //   try {
  //     afterResultObj = JSON.parse(byId("Result").innerText);
  //   } catch(e) {
  //     // set subsequent fields to errors
  //     return;
  //   }
  // }
  //
  // // step 5: Apply ResultSelector
  // if (byId("NoResultSelector").checked) {
  //   afterResultSelectorObj = afterResultObj;
  // }else if (byId("ResultSelectorWith").checked){
  //   try {
  //     afterResultSelectorObj = applyPath(afterResultObj, byId("ResultSelector").innerText);
  //   } catch(e) {
  //     byId("AfterResultSelector").innerText = "Invalid ResultSelector path";
  //     // set subsequent fields to errors
  //     return;
  //   }
  // }else{
  //   try {
  //     resultSelectorObj = JSON.parse(byId("ResultSelector").innerText);
  //   } catch(e) {
  //     console.log("Invalid JSON for ResultSelector");
  //     // warnings to user are handled elsewhere
  //     byId("AfterResultSelector").innerText = "Error: ResultSelector is invalid JSON";
  //     // todo: set subsequent fields to error
  //     return;
  //   }
  //   try {
  //     afterResultSelectorObj = recursivePath(resultSelectorObj, afterResultObj);
  //   } catch(e) {
  //     console.log(e);
  //     console.error("failed to apply JSONPath ResultSelector recursively");
  //     byId("AfterResultSelector").innerText = "Failed to evaluate ResultSelector as JSONPath";
  //     // TODO: set subsequent fields to errors
  //     return;
  //   }
  // };
  // byId("AfterResultSelector").innerText = JSON.stringify(afterResultSelectorObj, null, 4);
  //
  // // step 6: apply ResultPath
  // resultPathVal = byId("ResultPath").innerText;
  // if (resultPathVal.trim() === "null") {
  //   // special meaning in step functions
  //   // https://docs.aws.amazon.com/step-functions/latest/dg/input-output-resultpath.html#input-output-resultpath-null
  //   afterResultPathObj = inputObj; // before InputPath or Parameters
  // } else {
  //   try {
  //     console.log(`Applying jsonPath(${inputObj}, "${resultPathVal}")`);
  //     afterResultPathObj = applyPath(inputObj, resultPathVal);
  //   } catch(e) {
  //     console.log(resultObj);
  //     console.log("Failed to apply ResultPath")
  //     byId("AfterParameters").innerText = "Error applying fieldId earlier";
  //     return;
  //   }
  // }
  // console.log(afterResultPathObj);
  // byId("AfterResultPath").innerText = JSON.stringify(afterResultPathObj, null, 4);
  // console.log("ResultPath applied successfully");

// }

// example:
// obj = {"a": "$[1].a", "b": "$[2]"}
// dollar = [0, {"a": 123}, []]
// return val {"a": 123, "b": []}
function recursivePath(obj, dollar) {
  if (obj == null) {
    return obj;
  } else if (obj.constructor == Array){
    // it's a list
    // [recursivePath(x, dollar) for x in obj]
    return obj.map((x) => {
      return recursivePath(x, dollar)
    })
  } else if (isStr(obj)) {
    return obj;
  } else if (typeof obj == "number"){
    return obj;
  } else {
    console.debug(`I think ${obj} is a dict`);
    // the only thing left is a dictionary
    // (There are probably other things in theory,
    //  but not right after JSON.parse)
    for (const [key, value] of Object.entries(obj)) {
      if (isStr(key) && key.endsWith(".$")){
        new_key = key.replace(/\.\$$/gi, "");
        console.log(`Going to replace ${key}=${value}`);
        if (! isStr(value)){
          console.log(`Value ${value} for ${key} should be a string`);
          throw "Value ${value} for ${key} should be a string";
        } else{
          new_value = applyPath(dollar, value);
          if (new_value == undefined){
            console.log("JSONPath recursive failed for one value ${key}=${value}, so fail for the lot");
            throw "Failed to evaluate path ${value} for ${key}";
          }
        }
        console.log(`Changing ${key}=${value} to ${new_key}=${new_value}`);
        obj[new_key] = new_value;
        delete obj[key];
      } else {
        obj[key] = recursivePath(value, dollar);
      }
    };
    return obj;
  }
}

// applies the JSONPath path to the Object
// note that Step Functions use slightly different behavior
// to the js lib we're using
function applyPath(dollar, path){
  if (path === "$"){
    // jsonPath(x, "$") does not just return "$"
    // not sure why
    return dollar;
  }else{
    result = jsonPath(dollar, path);
    if ((result == undefined) || (result == false)){
      console.log(`Probably failed applying ${path} to ${dollar}`);
    }
    return result;
  }
}

// returns a boolean
// is x of type string
function isStr(x){
  return (typeof x === 'string' || x instanceof String);
}
