// debug/attach.js

import DebugPanel from "./DebugPanel.js";

export default function attachDebugPanel(dependencies) {
    const debugPanel = new DebugPanel(dependencies);

    return debugPanel;
}
