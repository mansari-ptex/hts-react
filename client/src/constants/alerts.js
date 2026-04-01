 export const CATEGORY_ALERT_RULES = {
                    "Babies & Infant Wear ": {
                        keywords: ["Babies' garments", "baby garments", "infants"],
                        message: `
                            <b>Babies’ Garments Notification</b>
                            <ul>
                               <li> Any garment intended for babies up to 86 cm height is always classified under HTS 6209, even if it resembles adult clothing.</li>
                            </ul>
                        `
                    },

                    "suit-type jackets": {
                    keywords: ["suit-type jackets", "business jackets", "formal jackets"],
                    message: `
                        <b>Suit-Type Jackets Notification</b>
                        <ul>
                            <li><b>Applicable headings</b>
                                <ul>
                                    <li>6103 / 6104 – Knit</li>
                                    <li>6203 / 6204 – Woven</li>
                                </ul>
                            </li>
                            <li>Tailored garments intended for business or social wear requiring formality</li>
                            <li>Full frontal opening with no closure or with closures other than a zipper</li>
                            <li>Sleeves of any length</li>
                            <li>Three or more body panels (excluding sleeves)</li>
                            <li>Includes two front panels sewn lengthwise</li>
                            <li>Does not extend below the mid-thigh</li>
                            <li>Not designed to be worn over another coat, jacket, or blazer</li>
                        </ul>
                    `
                },
                "ensembles": {
                keywords: ["ensembles", "garment ensembles", "clothing sets"],
                message: `
                    <b>Ensemble Classification Rules</b>
                    <ul>
                        <li>
                            An ensemble (HS 6103, 6104, 6203, 6204) is a retail set of garments made from
                            identical fabric, excluding suits, tracksuits, and ski-suits
                        </li>
                        <li>
                            <b>Upper garment</b>
                            <ul>
                                <li>One upper-body garment</li>
                                <li>A waistcoat or pullover may form a second upper piece in specific sets</li>
                            </ul>
                        </li>
                        <li>
                            <b>Lower garment(s)</b>
                            <ul>
                                <li>
                                    One or two items:
                                    trousers, bib & brace overalls, breeches, shorts, skirt, or divided skirt
                                </li>
                            </ul>
                        </li>
                        <li>
                            <b>Uniformity required</b>
                            <ul>
                                <li>Matching construction</li>
                                <li>Style</li>
                                <li>Colour</li>
                                <li>Composition</li>
                                <li>Compatible sizing</li>
                            </ul>
                        </li>
                        <li>
                            Must be reported as <b>separate articles</b> under individual 10-digit suffixes
                            (e.g., shirt, trousers, jacket reported separately)
                        </li>
                        <li>
                            All criteria must be met for classification as an ensemble
                        </li>
                    </ul>
                `
            },


    "suits": {
        keywords: ["suits","Suits"],
        message: `
        <b>Suit Classification Alert:</b>
        
        <ul>
        <li>A “suit” (HS 6103, 6104, 6203, 6204) must consist of 2 or 3 matching garments made from identical outer fabric.
        Reported as a single unit:</li>
        <li>Upper garment: One suit coat/jacket with 4 or more body panels (excluding sleeves)</li>
        <li>Lower garment:</li>
            <ul>
                <li>Men/Boys: Trousers, breeches, or shorts</li>
                <li>Women/Girls: Trousers, breeches, shorts, skirt or divided skirt.</li>
            </ul>
        <li>Optional tailored waistcoat: Front must match the suit fabric; back must match the jacket lining</li>
        <li>Uniformity required: Same fabric construction, colour, composition, style, and compatible size</li>
        <li>Included styles: Morning dress, evening dress (tailcoats), and dinner jacket suits</li>
        <li>All criteria must be met for classification as a suit.</li>
        </ul>
                `
            },

    "track suits": {
        keywords: [
            "track suits",
            "tracksuits",
            "ski-suits",
        ],
        message: `
        <b>Track Suits &amp; Ski-Suits Classification Alert:</b>
        <ul>
            <li>Track Suits: Coordinated sets consisting of a jacket and trousers.</li>
            <li>Ski-Suits: Garments principally intended for skiing, including:</li>
            <li>Ski Overall: One-piece garment covering the whole body</li>
            <li>Ski Ensemble: 2–3 piece set with a jacket-type garment (anorak/windbreaker) and one lower garment</li>
            <li>Colour rule: Components must have the same texture, style, and composition; colour matching is not required.</li>
            <li>Criteria must be met for correct classification.</li>
        </ul>
                `
            },
        };