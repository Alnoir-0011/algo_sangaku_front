import Typography from "@mui/material/Typography";

interface Props {
  place: google.maps.places.Place;
}

export default function Infowindow({ place }: Props) {
  return (
    <>
      <Typography variant="h4">{place.displayName}</Typography>
      <Typography variant="body1">{place.formattedAddress}</Typography>
    </>
  );
}
