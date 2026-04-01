import { COUNTRY_CODE_MAP } from "./countryCodes.js";

export const SPECIAL_COUNTRY_NAMES = [
    "Australia","Bahrain","Chile","Colombia","Israel","Jordan","South Korea","Morocco","Oman",
    "Costa Rica","Dominican Republic","El Salvador","Guatemala","Honduras","Nicaragua",
    "Panama","Peru","Canada","Mexico","Singapore","Japan",
    
    "Afghanistan","Albania","Algeria","Angola","Anguilla","Argentina","Armenia","Azerbaijan",
    "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil",
    "British Indian Ocean Territory","British Virgin Islands","Burkina Faso","Burundi",
    "Cabo Verde","Cambodia","Cameroon","Central African Republic","Chad","Christmas Island",
    "Cocos (Keeling) Islands","Comoros","Cook Islands","Cote d'Ivoire",
    "Congo, Democratic Republic","Djibouti","Dominica","Ecuador","Egypt","Eritrea",
    "Eswatini","Ethiopia","Falkland Islands","Fiji","Gabon","Gambia","Gaza Strip",
    "Georgia","Ghana","Grenada","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island",
    "Indonesia","Iraq","Jamaica","Kazakhstan","Kenya","Kiribati","Kosovo","Kyrgyzstan",
    "Lebanon","Lesotho","Liberia","Madagascar","Malawi","Maldives","Mali","Mauritania",
    "Mauritius","Moldova","Mongolia","Montenegro","Montserrat","Mozambique","Burma (Myanmar)",
    "Namibia","Nepal","Niger","Nigeria","Niue","Norfolk Island","North Macedonia","Pakistan",
    "Papua New Guinea","Paraguay","Philippines","Pitcairn Islands","Congo, Republic",
    "Rwanda","Saint Helena","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
    "Senegal","Serbia","Sierra Leone","Solomon Islands","Somalia","South Africa",
    "South Sudan","Sri Lanka","Suriname","Sao Tome and Principe","Tanzania","Thailand",
    "Timor-Leste","Togo","Tokelau","Tonga","Tunisia","Tuvalu","Uganda","Ukraine",
    "Uzbekistan","Vanuatu","Wallis and Futuna","West Bank","Yemen","Zambia","Zimbabwe",
    
    "Antigua and Barbuda","Aruba","Bahamas","Barbados","Curaçao",
    "Saint Kitts and Nevis","Trinidad and Tobago",
    ];
    

// ⭐ Convert names → ISO codes once
export const USA_SPECIAL_CODES = SPECIAL_COUNTRY_NAMES
  .map(name => COUNTRY_CODE_MAP[name])
  .filter(Boolean);
