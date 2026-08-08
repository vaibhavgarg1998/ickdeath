import Image, { type ImageProps } from "next/image";
import { withBasePath } from "@/lib/paths";

type AssetImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** next/image does not auto-prefix public paths with basePath — do it here. */
export function AssetImage({ src, ...props }: AssetImageProps) {
  return <Image src={withBasePath(src)} {...props} />;
}
