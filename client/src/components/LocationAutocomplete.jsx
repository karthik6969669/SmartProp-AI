// LocationAutocomplete.jsx
import { Autocomplete } from "@react-google-maps/api";

export default function LocationAutocomplete({ value, onPlaceSelect }) {
  const onLoad = (ac) => {
    autocompleteRef.current = ac;
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place || !place.geometry || !place.geometry.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    onPlaceSelect({
      formattedAddress: place.formatted_address || place.name,
      lat,
      lng,
    });
  };

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <input
        type="text"
        defaultValue={value}
        placeholder="e.g., SANNATHI STREET, Srivilliputhur"
      />
    </Autocomplete>
  );
}
