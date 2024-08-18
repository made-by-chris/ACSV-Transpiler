
import { createSignal, createEffect } from "solid-js";
import { example_placeholder_syntax_tutorial } from "./exampleACSV.ts";
import transpile from "./ACSVTranspiler.ts";
import { ACSV_Transpilation_Config } from "./ACSVTranspiler.ts";

function ACSVEditor() {
    const input_from_local_storage = localStorage.getItem("ACSVEditor_input") || example_placeholder_syntax_tutorial;
    const [leftText, setLeftText] = createSignal(input_from_local_storage);
    const [rightText, setRightText] = createSignal("");

    // listen to leftText changes
    createEffect(() => {

        const config: ACSV_Transpilation_Config = {
            input: leftText(),
            streaming: true,
            stats: true,
            streaming_callback: console.log,
            stats_callback: console.log,
        }

        const output = transpile(config);
        setRightText(output);

        localStorage.setItem("ACSVEditor_input", leftText());
        localStorage.setItem("ACSVEditor_updatedAt", Date.now().toString());

    });

    return (
        <div class="flex h-screen w-screen bg-red-400">
            <textarea
                placeholder="Enter ACSV here"
                class="w-1/2 h-full p-4"
                value={leftText()}
                onInput={(e) => setLeftText(e.target.value)}
            ></textarea>
            <textarea
                id="acsv-editor-output"
                placeholder="Transpiled CSV will appear here"
                class="w-1/2 h-full p-4 bg-gray-200"
                value={rightText()}
                readonly
            ></textarea>
        </div>
    );
}

export default ACSVEditor;
