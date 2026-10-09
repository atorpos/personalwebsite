import {
  IoCall,
  IoGlobeOutline,
  IoLocation,
  IoLogoBehance,
  IoLogoDribbble,
  IoLogoFacebook,
  IoLogoGithub,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoMedium,
  IoLogoStackoverflow,
  IoLogoTiktok,
  IoLogoYoutube,
  IoMail,
} from 'react-icons/io5'
import { TfiHome, TfiPencilAlt } from 'react-icons/tfi'
import {
  SlBookOpen,
  SlBriefcase,
  SlBulb,
  SlCalender,
  SlCamera,
  SlDiamond,
  SlEnvolope,
  SlGlobe,
  SlGraph,
  SlHeart,
  SlNote,
  SlPeople,
  SlPicture,
  SlRocket,
  SlScreenDesktop,
  SlScreenSmartphone,
  SlStar,
  SlTrophy,
  SlUser,
} from 'react-icons/sl'

/**
 * Icons for the choices in Payload CMS (src/personal/options.ts in the CMS): keep the keys in sync
 * with the values there.
 */

// react-icons 4.7 has no X logo yet
const IoLogoX = (props) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
)

/** Main menu */
export const menuIcons = {
  home: TfiHome,
  user: SlUser,
  briefcase: SlBriefcase,
  pencil: TfiPencilAlt,
  trophy: SlTrophy,
  envelope: SlEnvolope,
  camera: SlCamera,
  picture: SlPicture,
  book: SlBookOpen,
  note: SlNote,
  star: SlStar,
  heart: SlHeart,
  globe: SlGlobe,
  rocket: SlRocket,
  bulb: SlBulb,
  graph: SlGraph,
  people: SlPeople,
  calendar: SlCalender,
  screen: SlScreenDesktop,
  smartphone: SlScreenSmartphone,
  diamond: SlDiamond,
}

/** Social links under the menu, and the matching contact details */
export const socialPlatforms = {
  github: { name: 'GitHub', Icon: IoLogoGithub },
  linkedin: { name: 'LinkedIn', Icon: IoLogoLinkedin },
  youtube: { name: 'YouTube', Icon: IoLogoYoutube },
  x: { name: 'X', Icon: IoLogoX },
  instagram: { name: 'Instagram', Icon: IoLogoInstagram },
  facebook: { name: 'Facebook', Icon: IoLogoFacebook },
  medium: { name: 'Medium', Icon: IoLogoMedium },
  stackoverflow: { name: 'Stack Overflow', Icon: IoLogoStackoverflow },
  dribbble: { name: 'Dribbble', Icon: IoLogoDribbble },
  behance: { name: 'Behance', Icon: IoLogoBehance },
  tiktok: { name: 'TikTok', Icon: IoLogoTiktok },
  email: { name: 'Email', Icon: IoMail },
  website: { name: 'Website', Icon: IoGlobeOutline },
}

/** Contact details on the Contact page (the icons of content/contact.md are the same Ionicons) */
export const contactIcons = {
  phone: IoCall,
  location: IoLocation,
  ...Object.fromEntries(Object.entries(socialPlatforms).map(([key, { Icon }]) => [key, Icon])),
}

/** A key of one of the maps above, without picking up properties such as "constructor" */
export const iconFor = (icons, key) =>
  Object.prototype.hasOwnProperty.call(icons, key) ? icons[key] : undefined
