import * as React from "react";

// Uses localstorage to persist a given preference. Returns a tuple of the
// preference and a setter function which will be used to update the preference.
export function usePreference<T>(preferenceName: string, defaultValue: T) {
  const [preference, setPreference] = React.useState<T>(defaultValue);

  React.useEffect(() => {
    const storedPreference = localStorage.getItem(preferenceName);
    if (storedPreference) {
      console.log({ storedPreference });
      try {
        setPreference(JSON.parse(storedPreference));
      } catch (e) {
        console.warn("Failed to parse stored preference", e);
        localStorage.setItem(preferenceName, JSON.stringify(defaultValue));
      }
    } else {
      localStorage.setItem(preferenceName, JSON.stringify(defaultValue));
    }
  }, [preferenceName]);

  const onChange = React.useCallback(() => {
    const storedPreference = localStorage.getItem(preferenceName);
    if (storedPreference) {
      setPreference(JSON.parse(storedPreference));
    }
  }, [setPreference]);

  React.useEffect(() => {
    window.addEventListener("prefernece_change_" + preferenceName, onChange);
    return () => {
      window.removeEventListener("prefernece_change_" + preferenceName, onChange);
    };
  }, [preferenceName, onChange]);

  return [
    preference,
    (value: T) => {
      console.log({ value, js: JSON.stringify(value) });
      localStorage.setItem(preferenceName, JSON.stringify(value));
      window.dispatchEvent(new Event("prefernece_change_" + preferenceName));
    },
  ] as [T, (value: T) => void];
}
