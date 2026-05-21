"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import Cropper, { type Area } from "react-easy-crop";

type SocialLinkType = "link" | "qrcode";

type UserView = {
  id: string;
  qq: string;
  username: string;
  stampImageUrl: string | null;
  nfcUrl: string;
};

type SocialLinkView = {
  id: string;
  type: SocialLinkType;
  platformName: string;
  url: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

type EditableSocialLink = {
  id: string;
  type: SocialLinkType;
  platformName: string;
  url: string;
  imageUrl: string;
  sortOrder: number;
};

type CropTarget =
  | { kind: "stamp" }
  | { kind: "newQr" }
  | { kind: "linkQr"; linkId: string };

type MeClientProps = {
  initialUser: UserView;
  initialSocialLinks: SocialLinkView[];
};

const STAMP_WIDTH = 600;
const STAMP_HEIGHT = 800;
const STAMP_RATIO = STAMP_WIDTH / STAMP_HEIGHT;
const QR_CODE_SIZE = 600;
const STAMP_PREVIEW_WIDTH = 90;
const STAMP_PREVIEW_HEIGHT = 120;
const QR_PREVIEW_SIZE = 120;

function toEditableLink(link: SocialLinkView): EditableSocialLink {
  return {
    ...link,
    url: link.url || "",
    imageUrl: link.imageUrl || "",
  };
}

function sortLinks(items: EditableSocialLink[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    throw new Error(
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : "Request failed.",
    );
  }

  return body as T;
}

function linkPayload(link: EditableSocialLink) {
  return {
    type: link.type,
    platformName: link.platformName,
    url: link.type === "link" ? link.url || null : null,
    imageUrl: link.type === "qrcode" ? link.imageUrl || null : null,
    sortOrder: link.sortOrder,
  };
}

function getCropSettings(target: CropTarget | null) {
  if (target?.kind === "stamp") {
    return {
      title: "Crop stamp",
      aspect: STAMP_RATIO,
      outputWidth: STAMP_WIDTH,
      outputHeight: STAMP_HEIGHT,
      previewWidth: STAMP_PREVIEW_WIDTH,
      previewHeight: STAMP_PREVIEW_HEIGHT,
      confirmLabel: "Confirm upload",
    };
  }

  return {
    title: "Crop QR code",
    aspect: 1,
    outputWidth: QR_CODE_SIZE,
    outputHeight: QR_CODE_SIZE,
    previewWidth: QR_PREVIEW_SIZE,
    previewHeight: QR_PREVIEW_SIZE,
    confirmLabel: "Confirm QR code",
  };
}

function canvasToWebpBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      0.9,
    );
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Invalid image file."));
    image.src = src;
  });
}

async function drawCroppedImage(
  imageSrc: string,
  cropPixels: Area,
  outputWidth: number,
  outputHeight: number,
) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to crop image.");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return canvas;
}

export default function MeClient({
  initialUser,
  initialSocialLinks,
}: MeClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const pendingQrTargetRef = useRef<CropTarget | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [username, setUsername] = useState(initialUser.username);
  const [displayUsername, setDisplayUsername] = useState(initialUser.username);
  const [stampImageUrl, setStampImageUrl] = useState(initialUser.stampImageUrl);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [links, setLinks] = useState(
    sortLinks(initialSocialLinks.map(toEditableLink)),
  );
  const [newLink, setNewLink] = useState({
    type: "link" as SocialLinkType,
    platformName: "",
    url: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!cropImageUrl || !croppedAreaPixels || !previewCanvasRef.current) {
      return;
    }

    let isCurrent = true;
    const settings = getCropSettings(cropTarget);

    drawCroppedImage(
      cropImageUrl,
      croppedAreaPixels,
      settings.previewWidth,
      settings.previewHeight,
    )
      .then((canvas) => {
        if (!isCurrent || !previewCanvasRef.current) {
          return;
        }

        const previewCanvas = previewCanvasRef.current;
        const context = previewCanvas.getContext("2d");

        if (!context) {
          return;
        }

        previewCanvas.width = settings.previewWidth;
        previewCanvas.width = settings.previewWidth;
        previewCanvas.height = settings.previewHeight;
        context.clearRect(0, 0, settings.previewWidth, settings.previewHeight);
        context.drawImage(canvas, 0, 0);
      })
      .catch(() => {
        // The upload confirmation path will surface image errors.
      });

    return () => {
      isCurrent = false;
    };
  }, [cropImageUrl, cropTarget, croppedAreaPixels]);

  useEffect(() => {
    return () => {
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }
    };
  }, [cropImageUrl]);

  function showMessage(value: string) {
    setError("");
    setMessage(value);
  }

  function showError(value: string) {
    setMessage("");
    setError(value);
  }

  async function reloadLinks() {
    const body = await requestJson<{ items: SocialLinkView[] }>(
      "/api/me/social-links",
    );

    setLinks(sortLinks(body.items.map(toEditableLink)));
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      await requestJson("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setDisplayUsername(username);
      showMessage("Nickname saved.");
    } catch (caughtError) {
      showError(
        caughtError instanceof Error ? caughtError.message : "Save failed.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  function openStampFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }

  function openQrFilePicker(target: CropTarget) {
    pendingQrTargetRef.current = target;

    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = "";
      qrFileInputRef.current.click();
    }
  }

  function openCurrentCropFilePicker() {
    if (!cropTarget || cropTarget.kind === "stamp") {
      openStampFilePicker();
      return;
    }

    openQrFilePicker(cropTarget);
  }

  function openCropperFromFile(file: File, target: CropTarget) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showError("Only jpg, png, and webp images are supported.");
      return;
    }

    const url = URL.createObjectURL(file);

    setCropImageUrl(url);
    setCropTarget(target);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    showMessage("Adjust the crop, then confirm upload.");
  }

  function closeCropper() {
    setCropImageUrl(null);
    setCropTarget(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = "";
    }
  }

  async function handleConfirmCrop() {
    if (!cropImageUrl || !croppedAreaPixels || !cropTarget) {
      showError("Crop the image first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    const settings = getCropSettings(cropTarget);

    try {
      const canvas = await drawCroppedImage(
        cropImageUrl,
        croppedAreaPixels,
        settings.outputWidth,
        settings.outputHeight,
      );
      const blob = await canvasToWebpBlob(canvas);
      formData.append(
        "file",
        new File([blob], "crop.webp", { type: "image/webp" }),
      );

      if (cropTarget.kind === "stamp") {
        const body = await requestJson<{ stampImageUrl: string }>(
          "/api/me/stamp",
          {
            method: "POST",
            body: formData,
          },
        );

        setStampImageUrl(body.stampImageUrl);
        closeCropper();
        showMessage("Stamp uploaded.");
        return;
      }

      const body = await requestJson<{ imageUrl: string }>("/api/me/qrcode", {
        method: "POST",
        body: formData,
      });

      if (cropTarget.kind === "newQr") {
        setNewLink((current) => ({
          ...current,
          type: "qrcode",
          url: "",
          imageUrl: body.imageUrl,
        }));
        closeCropper();
        showMessage("QR code uploaded.");
        return;
      }

      const currentLink = links.find((link) => link.id === cropTarget.linkId);

      if (!currentLink) {
        throw new Error("Social link was not found.");
      }

      const updatedLink = {
        ...currentLink,
        type: "qrcode" as SocialLinkType,
        url: "",
        imageUrl: body.imageUrl,
      };

      setLinks((currentLinks) =>
        currentLinks.map((link) =>
          link.id === updatedLink.id ? updatedLink : link,
        ),
      );
      await requestJson(`/api/me/social-links/${updatedLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkPayload(updatedLink)),
      });
      await reloadLinks();
      closeCropper();
      showMessage("QR code uploaded.");
    } catch (caughtError) {
      showError(
        caughtError instanceof Error ? caughtError.message : "Upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleStampFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    openCropperFromFile(file, { kind: "stamp" });
  }

  async function handleQrFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = pendingQrTargetRef.current;

    if (!file || !target) {
      return;
    }

    openCropperFromFile(file, target);
  }

  async function handleCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await requestJson("/api/me/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLink,
          sortOrder: links.length * 10,
        }),
      });
      setNewLink({
        type: "link",
        platformName: "",
        url: "",
        imageUrl: "",
      });
      await reloadLinks();
      showMessage("Social link added.");
    } catch (caughtError) {
      showError(
        caughtError instanceof Error ? caughtError.message : "Add failed.",
      );
    }
  }

  function updateLink(id: string, patch: Partial<EditableSocialLink>) {
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === id ? { ...link, ...patch } : link,
      ),
    );
  }

  async function saveLink(link: EditableSocialLink) {
    try {
      await requestJson(`/api/me/social-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkPayload(link)),
      });
      await reloadLinks();
      showMessage("Social link saved.");
    } catch (caughtError) {
      showError(
        caughtError instanceof Error ? caughtError.message : "Save failed.",
      );
    }
  }

  async function deleteLink(id: string) {
    try {
      await requestJson(`/api/me/social-links/${id}`, {
        method: "DELETE",
      });
      setLinks((currentLinks) => currentLinks.filter((link) => link.id !== id));
      showMessage("Social link deleted.");
    } catch (caughtError) {
      showError(
        caughtError instanceof Error ? caughtError.message : "Delete failed.",
      );
    }
  }

  async function moveLink(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= links.length) {
      return;
    }

    const reordered = [...links];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    const normalized = reordered.map((link, orderIndex) => ({
      ...link,
      sortOrder: orderIndex * 10,
    }));

    setLinks(normalized);

    try {
      await Promise.all(
        normalized.map((link) =>
          requestJson(`/api/me/social-links/${link.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(linkPayload(link)),
          }),
        ),
      );
      await reloadLinks();
      showMessage("Sort order saved.");
    } catch (caughtError) {
      await reloadLinks();
      showError(
        caughtError instanceof Error ? caughtError.message : "Sort failed.",
      );
    }
  }

  const cropSettings = getCropSettings(cropTarget);

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">ComiLink</p>
          <h1 className="mt-2 text-2xl font-semibold">My Profile</h1>
          <div className="mt-5 grid gap-3 text-sm">
            <p>
              <span className="font-medium text-zinc-500">QQ: </span>
              {initialUser.qq}
            </p>
            <p>
              <span className="font-medium text-zinc-500">Nickname: </span>
              {displayUsername}
            </p>
            <p className="break-all">
              <span className="font-medium text-zinc-500">NFC link: </span>
              <a className="text-blue-700 underline" href={initialUser.nfcUrl}>
                {initialUser.nfcUrl}
              </a>
            </p>
          </div>
        </section>

        {message ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Nickname</h2>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={handleProfileSubmit}
          >
            <input
              className="h-10 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            <button
              className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400"
              disabled={isSavingProfile}
              type="submit"
            >
              {isSavingProfile ? "Saving..." : "Save"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Stamp</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
              {stampImageUrl ? (
                <NextImage
                  alt="Current stamp"
                  className="h-full w-full object-contain"
                  height={160}
                  src={stampImageUrl}
                  width={160}
                />
              ) : (
                <span className="text-sm text-zinc-500">No stamp</span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <input
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleStampFileChange}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400 sm:w-fit"
                disabled={isUploading}
                onClick={openStampFilePicker}
                type="button"
              >
                {isUploading ? "Uploading..." : "Upload stamp"}
              </button>
            </div>
          </div>
        </section>

        {cropImageUrl ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <section className="flex max-h-full w-full max-w-3xl flex-col overflow-auto rounded-lg bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{cropSettings.title}</h2>
                <button
                  className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700"
                  disabled={isUploading}
                  onClick={closeCropper}
                  type="button"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_130px]">
                <div className="relative h-[420px] min-h-80 overflow-hidden rounded-md bg-zinc-950">
                  <Cropper
                    aspect={cropSettings.aspect}
                    crop={crop}
                    cropShape="rect"
                    image={cropImageUrl}
                    maxZoom={4}
                    minZoom={1}
                    onCropChange={setCrop}
                    onCropComplete={(_croppedArea, nextCroppedAreaPixels) =>
                      setCroppedAreaPixels(nextCroppedAreaPixels)
                    }
                    onZoomChange={setZoom}
                    restrictPosition
                    showGrid
                    zoom={zoom}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-700">
                      Final preview
                    </p>
                    <canvas
                      className="rounded-md border border-zinc-200 bg-zinc-50"
                      height={cropSettings.previewHeight}
                      ref={previewCanvasRef}
                      style={{
                        height: cropSettings.previewHeight,
                        width: cropSettings.previewWidth,
                      }}
                      width={cropSettings.previewWidth}
                    />
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    Zoom
                    <input
                      max="4"
                      min="1"
                      onChange={(event) => setZoom(Number(event.target.value))}
                      step="0.05"
                      type="range"
                      value={zoom}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800"
                  disabled={isUploading}
                  onClick={openCurrentCropFilePicker}
                  type="button"
                >
                  Choose another
                </button>
                <button
                  className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-400"
                  disabled={isUploading || !croppedAreaPixels}
                  onClick={handleConfirmCrop}
                  type="button"
                >
                  {isUploading ? "Uploading..." : cropSettings.confirmLabel}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Social Links</h2>
          <form className="mt-4 grid gap-3" onSubmit={handleCreateLink}>
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <select
                className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setNewLink((current) => ({
                    ...current,
                    type: event.target.value as SocialLinkType,
                    url: event.target.value === "qrcode" ? "" : current.url,
                    imageUrl:
                      event.target.value === "link" ? "" : current.imageUrl,
                  }))
                }
                value={newLink.type}
              >
                <option value="link">Link</option>
                <option value="qrcode">QR Code</option>
              </select>
              <input
                className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                onChange={(event) =>
                  setNewLink((current) => ({
                    ...current,
                    platformName: event.target.value,
                  }))
                }
                placeholder="Platform name"
                value={newLink.platformName}
              />
            </div>
            {newLink.type === "link" ? (
              <input
                className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                onChange={(event) =>
                  setNewLink((current) => ({
                    ...current,
                    url: event.target.value,
                  }))
                }
                placeholder="URL"
                value={newLink.url}
              />
            ) : (
              <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                {newLink.imageUrl ? (
                  <NextImage
                    alt="New QR code preview"
                    className="h-24 w-24 rounded-md border border-zinc-200 bg-white object-contain"
                    height={96}
                    src={newLink.imageUrl}
                    width={96}
                  />
                ) : null}
                <button
                  className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-fit"
                  onClick={() => openQrFilePicker({ kind: "newQr" })}
                  type="button"
                >
                  Upload QR Code
                </button>
              </div>
            )}
            <button
              className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-fit"
              type="submit"
            >
              Add social link
            </button>
          </form>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleQrFileChange}
            ref={qrFileInputRef}
            type="file"
          />

          <div className="mt-6 flex flex-col gap-3">
            {links.length === 0 ? (
              <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                No social links yet.
              </p>
            ) : null}
            {links.map((link, index) => (
              <div
                className="grid gap-3 rounded-md border border-zinc-200 p-3"
                key={link.id}
              >
                <div className="grid gap-3 sm:grid-cols-[120px_1fr_90px]">
                  <select
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                    onChange={(event) => {
                      const nextType = event.target.value as SocialLinkType;

                      updateLink(link.id, {
                        type: nextType,
                        url: nextType === "qrcode" ? "" : link.url,
                        imageUrl: nextType === "link" ? "" : link.imageUrl,
                      });
                    }}
                    value={link.type}
                  >
                    <option value="link">Link</option>
                    <option value="qrcode">QR Code</option>
                  </select>
                  <input
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                    onChange={(event) =>
                      updateLink(link.id, { platformName: event.target.value })
                    }
                    value={link.platformName}
                  />
                  <input
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                    onChange={(event) =>
                      updateLink(link.id, {
                        sortOrder: Number(event.target.value),
                      })
                    }
                    type="number"
                    value={link.sortOrder}
                  />
                </div>
                {link.type === "link" ? (
                  <input
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
                    onChange={(event) =>
                      updateLink(link.id, { url: event.target.value })
                    }
                    placeholder="URL"
                    value={link.url}
                  />
                ) : (
                  <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    {link.imageUrl ? (
                      <NextImage
                        alt={`${link.platformName} QR code`}
                        className="h-24 w-24 rounded-md border border-zinc-200 bg-white object-contain"
                        height={96}
                        src={link.imageUrl}
                        width={96}
                      />
                    ) : null}
                    <button
                      className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 sm:w-fit"
                      onClick={() =>
                        openQrFilePicker({ kind: "linkQr", linkId: link.id })
                      }
                      type="button"
                    >
                      Upload QR Code
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 disabled:text-zinc-400"
                    disabled={index === 0}
                    onClick={() => moveLink(index, -1)}
                    type="button"
                  >
                    Up
                  </button>
                  <button
                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 disabled:text-zinc-400"
                    disabled={index === links.length - 1}
                    onClick={() => moveLink(index, 1)}
                    type="button"
                  >
                    Down
                  </button>
                  <button
                    className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
                    onClick={() => saveLink(link)}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="h-9 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700"
                    onClick={() => deleteLink(link.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
