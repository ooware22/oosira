'use client';

import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const iconStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  display: 'inline-block',
  verticalAlign: '-1px',
  marginRight: 3,
  strokeWidth: 2.5,
};

export function EmailIcon() {
  return <EnvelopeIcon style={iconStyle} />;
}

export function PhoneIcn() {
  return <PhoneIcon style={iconStyle} />;
}

export function LocationIcon() {
  return <MapPinIcon style={iconStyle} />;
}

export function LinkedInIcon() {
  return <LinkIcon style={iconStyle} />;
}
