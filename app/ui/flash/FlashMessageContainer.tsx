import { getFlash } from "@/app/lib/actions/flash";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";
import { v4 as uuid } from "uuid";

export default async function FlashMessageContainer() {
  try {
    const flashData = await getFlash();

    if (!flashData) {
      return null;
    }

    return (
      <FlashMessagePresentation
        key={uuid()}
        type={flashData.type}
        message={flashData.message}
      />
    );
  } catch (error) {
    console.error("Error in FlashMessage component:", error);
    return null;
  }
}
