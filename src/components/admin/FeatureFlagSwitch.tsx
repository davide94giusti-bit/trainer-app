import { FormControlLabel, Switch } from '@mui/material';

export default function FeatureFlagSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <FormControlLabel control={<Switch checked={checked} onChange={event => onChange(event.target.checked)} />} label={label} />;
}
