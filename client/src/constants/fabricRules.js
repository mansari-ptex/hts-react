export const FABRIC_CLASSIFICATION_HTML = `
<div class="fabric-classification">

    <input
        type="text"
        class="fabric-search"
        placeholder="Search fabric rules..."
        oninput="filterFabricRules(this)"
    />

    <h3>Fabric Classification Rules</h3>

    <ul class="fabric-rule-list">
        <li><strong>Artificial Fibers:</strong> Chemically transformed natural polymers (viscose, cupro, acetate).</li>
        <li><strong>Coated/Covered with Rubber or Plastic:</strong> Fabrics impregnated, coated, covered, or laminated with plastics or rubber.</li>
        <li><strong>Cotton:</strong> Natural vegetable fibers of the genus <em>Gossypium</em>.</li>
        <li><strong>Fine Animal Hair:</strong> Hair of alpaca, llama, vicuna, camel, yak, Angora, etc.</li>
        <li><strong>Flax Fibers:</strong> Linen fiber; apparel with ≥36% by weight.</li>
        <li><strong>Man-Made Fibers:</strong> Manufactured organic polymer fibers.</li>
        <li><strong>Metallized Yarn:</strong> Any metal content → other textile material.</li>
        <li><strong>Other Textile Materials:</strong> Basket category; linen (835).</li>
        <li><strong>Silk or Silk Waste:</strong> Natural fibers from silkworm cocoons.</li>
        <li><strong>Subject to Cotton Restraints (334):</strong> Cotton ≥50%.</li>
        <li><strong>Subject to Man-Made Fiber Restraints (634):</strong> MMF ≥50%.</li>
        <li><strong>Subject to Wool Restraints (434):</strong> Wool >17%.</li>
        <li><strong>Synthetic Fibers:</strong> Polymerization fibers (nylon, polyester).</li>
        <li><strong>Vegetable Fibers:</strong> Flax, hemp, ramie, abaca.</li>
        <li><strong>Wool:</strong> Natural fiber from sheep or lambs.</li>
    </ul>
</div>
`;
