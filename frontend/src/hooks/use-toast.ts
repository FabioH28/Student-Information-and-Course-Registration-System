export function useToast() {
  return {
    toast: ({ title, description }: { title?: string; description?: string }) => {
      if (description) console.info(title ? `${title}: ${description}` : description);
      else if (title) console.info(title);
    },
  };
}
