//////////////////////////////////////////////////////////////////////////////////////
// Disposition Markers - By QueasyBun                                               //
//                                                                                  //
// Module dependencies:                                                             //
// - Token Magic FX                                                                 //
// - Tagger (Optional)                                                              //
//                                                                                  //
// Tested on Foundry V10.290                                                        //
// Token Magic FX V0.6.1.2                                                          //
// Tagger V1.3.9                                                                    //
//                                                                                  //
// This script can use Tagger to only affect tokens that have the "Social" tag.     //
// This way not all tokens display their disposition.                               //
// This is optional, so if tagger isn't installed, set usesTagger to false.         //
// This will cause this script to apply to all tokens.                              //
//                                                                                  //
// Don't forget to add this script to the "esmodules" array in your world.json!     //
// See https://foundryvtt.wiki/en/basics/world-scripts for instructions.            //
//////////////////////////////////////////////////////////////////////////////////////

let usesTagger = true;

//Setup script, create the parameters as global settings so they're accessible later and don't have to be redefined every time.
Hooks.once("setup", () => {
   console.info("World Script | Registering disposition marker worldscript");
   
   //Setup the first set of parameters
   globalThis.DispositionParamsFriendly =
   [{
      filterId: "dispositionMarker",
      filterType: "glow",
      outerStrength: 4,
      color: 0x14a647,
      padding: 40
   }];
   
   //Base the other two off of the first one.
   globalThis.DispositionParamsNeutral = [{...globalThis.DispositionParamsFriendly[0], color : 0x2596be}];
   globalThis.DispositionParamsHostile = [{...globalThis.DispositionParamsFriendly[0], color : 0xfc0703}];
});

//Trigger every time you switch maps to check for tokens that should have a disposition marker.
Hooks.on("canvasReady", () => {
    let allTokens;
    
    //If tagger is used, grab all tokens that are tagged as Social. If not, just grab all tokens.
    if(usesTagger == true)
        allTokens = Tagger.getByTag("Social");
    else
        allTokens = canvas.tokens.placeables.map(token => token.document);
    
    //Set a disposition marker for all relevant tokens.
    allTokens.forEach(token => {
        setDispositionMarker(token._object, token.disposition);
    });
});

//Trigger every time a token is updated.
console.log("World Script | Disposition Marker update hook index is " + Hooks.on("updateToken", async function(doc, change) {
    
    //If the change is in the tokenmagic flags, do nothing (Adding and deleting filters later will trigger another instance of this event, so this check prevents a loop).
    if(change.flags?.tokenmagic != undefined)
    return;
    
    //Clear any disposition markers. Doing this before the Social check so that removing the tag also removes the marker.
    await TokenMagic.deleteFilters(doc._object, "dispositionMarker");
    
    //Store wether or not the change adds the social flag. This is used in later checks.
    let changeAddsSocialFlag = change.flags?.tagger?.tags?.includes("Social");
    
    //If the token that triggered this does not have the "Social" tag, and this event doesn't add it, do nothing. This is ignored if usesTagger is set to false.
	if(usesTagger && !doc.flags?.tagger?.tags?.includes("Social") && !changeAddsSocialFlag)
    return;

    //If the change does not include a change to disposition, and this change does not add the social tag, do nothing.
    //If the change does add the social tag, grab the token's current distribution.
    let disposition = changeAddsSocialFlag ? doc.disposition : change.disposition;
    if(disposition == undefined)
    return;

    //If it made it this far, set the disposition marker.
    setDispositionMarker(doc._object,disposition);
}));

function setDispositionMarker(placeable, disposition) {
    console.info("World Script | Changing disposition marker on token " + placeable.id + " (" + placeable.name + ")");
    
    //Figure out which set of parameters should be applied to the filter based on the given disposition.
    let pickParams;
    switch (disposition) {
        case 1:
            pickParams = globalThis.DispositionParamsFriendly;
            break;
        case -1:
            pickParams = globalThis.DispositionParamsHostile;
            break;
        default:
            pickParams = globalThis.DispositionParamsNeutral;
            break;
    }
    
    //Add the filter to the token.
    TokenMagic.addUpdateFilters(placeable,pickParams);
};
