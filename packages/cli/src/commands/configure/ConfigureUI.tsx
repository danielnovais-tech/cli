import React from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { RadioButtonSelect } from '../../ui/components/shared/RadioButtonSelect.js';
import { PROVIDERS } from '../configure.js';

// Define colors inline
const Colors = {
  AccentCyan: 'cyan',
  AccentGreen: 'green',
  AccentRed: 'red',
  AccentYellow: 'yellow',
  Gray: 'gray',
};

type Step = 'provider' | 'apiKey' | 'baseUrl' | 'model' | 'confirm' | 'complete';

function useConfigureUI() {
  const [step, setStep] = React.useState<Step>('provider');
  const [selectedProvider, setSelectedProvider] = React.useState<any>(null);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [modelSearch, setModelSearch] = React.useState('');
  const [error, setError] = React.useState('');
  const [isFetchingModels, setIsFetchingModels] = React.useState(false);
  const [fetchedModels, setFetchedModels] = React.useState<string[]>([]);

  return {
    step,
    setStep,
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    modelSearch,
    setModelSearch,
    error,
    setError,
    isFetchingModels,
    setIsFetchingModels,
    fetchedModels,
    setFetchedModels,
  };
}

interface ConfigureUIProps {
  onComplete?: (config: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  }) => void;
}

export function ConfigureUI({ onComplete }: ConfigureUIProps): React.JSX.Element {
  const { exit } = useApp();
  const {
    step,
    setStep,
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    baseUrl,
    setBaseUrl,
    model,
    setModel,
    modelSearch,
    setModelSearch,
    error,
    setError,
    isFetchingModels,
    setIsFetchingModels,
    fetchedModels,
    setFetchedModels,
  } = useConfigureUI();

  const handleProviderSelect = (value: string) => {
    const provider = PROVIDERS.find((p: any) => p.name === value);
    if (provider) {
      setSelectedProvider(provider);
      setStep('apiKey');
    }
  };

  const handleApiKeySubmit = (value: string) => {
    const key = value || process.env[selectedProvider?.envKeyName || ''];
    if (!key) {
      setError('API key is required');
      return;
    }
    setApiKey(key);
    setError('');
    setStep('baseUrl');
  };

  const handleBaseUrlSubmit = (value: string) => {
    const url = value || selectedProvider?.defaultBaseUrl || '';
    setBaseUrl(url);
    setError('');
    setStep('model');
  };

  const handleModelSearchSubmit = (value: string) => {
    if (value) {
      setModel(value);
      setStep('confirm');
    }
  };

  const handleModelSelect = (value: string) => {
    setModel(value);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (onComplete) {
      onComplete({
        provider: selectedProvider?.name || '',
        apiKey,
        baseUrl,
        model,
      });
    }
    setStep('complete');
  };

  const filteredModels = React.useMemo(() => {
    const allModels = fetchedModels.length > 0 ? fetchedModels : (selectedProvider?.defaultModels || []);
    if (!modelSearch) return allModels;
    return allModels.filter((m: string) =>
      m.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [fetchedModels, selectedProvider, modelSearch]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color={Colors.AccentCyan}>
          🚀 Blackbox CLI Configuration
        </Text>
      </Box>

      {step === 'provider' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Select your AI provider:</Text>
          </Box>  
          <RadioButtonSelect
            items={PROVIDERS.map((p: any) => ({
              label: p.displayName,
              value: p.name,
            }))}
            onSelect={handleProviderSelect}
            isFocused={true}
          />
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              Use ↑↓ arrows to navigate, Enter to select, Ctrl+C to cancel
            </Text>
          </Box>
        </Box>
      )}

      {step === 'apiKey' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>
              Configure <Text color={Colors.AccentGreen}>{selectedProvider.displayName}</Text>
            </Text>
          </Box>
          {process.env[selectedProvider.envKeyName] && (
            <Box marginBottom={1}>
              <Text color={Colors.AccentGreen}>
                ✓ API key found in environment variable {selectedProvider.envKeyName}
              </Text>
            </Box>
          )}
          <Box marginBottom={1}>
            <Text>Enter your API key (or press Enter to use existing):</Text>
          </Box>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            onSubmit={handleApiKeySubmit}
            placeholder="Enter API key..."
          />
          {error && (
            <Box marginTop={1}>
              <Text color={Colors.AccentRed}>❌ {error}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>Press Enter to continue, Ctrl+C to cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'baseUrl' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Base URL (press Enter to use default):</Text>
          </Box>
          <TextInput
            value={baseUrl}
            onChange={setBaseUrl}
            onSubmit={handleBaseUrlSubmit}
            placeholder={selectedProvider.defaultBaseUrl}
          />
          {error && (
            <Box marginTop={1}>
              <Text color={Colors.AccentRed}>❌ {error}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>Press Enter to continue, Ctrl+C to cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'model' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Select a model or search for a custom one:</Text>
          </Box>
          {isFetchingModels && (
            <Box marginBottom={1}>
              <Text color={Colors.AccentCyan}>
                ⏳ Fetching available models from {selectedProvider.displayName}...
              </Text>
            </Box>
          )}
          {!isFetchingModels && fetchedModels.length > 0 && (
            <Box marginBottom={1}>
              <Text color={Colors.AccentGreen}>
                ✓ Loaded {fetchedModels.length} models from {selectedProvider.displayName} API
              </Text>
            </Box>
          )}
          {!isFetchingModels && fetchedModels.length === 0 && (
            <Box marginBottom={1}>
              <Text color={Colors.AccentYellow}>
                ⚠ Could not fetch models from API, using default list
              </Text>
            </Box>
          )}
          <TextInput
            value={modelSearch}
            onChange={setModelSearch}
            onSubmit={handleModelSearchSubmit}
            placeholder="Search or enter model name..."
          />
          {filteredModels.length > 0 && (
            <Box marginTop={1}>
              <RadioButtonSelect
                items={filteredModels.map((m: string) => ({
                  label: m,
                  value: m,
                }))}
                onSelect={handleModelSelect}
                isFocused={true}
                maxItemsToShow={8}
                showScrollArrows={true}
              />
            </Box>
          )}
          {modelSearch && filteredModels.length === 0 && (
            <Box marginTop={1}>
              <Text color={Colors.Gray}>
                  No matching models. Press Enter to use {modelSearch} as custom model.
              </Text>
            </Box>
          )}
          {error && (
            <Box marginTop={1}>
              <Text color={Colors.AccentRed}>❌ {error}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text color={Colors.Gray}>
              {filteredModels.length > 0
                ? 'Type to filter, use ↑↓ to navigate, Enter to select, Ctrl+C to cancel'
                : 'Type model name and press Enter to use custom model, Ctrl+C to cancel'}
            </Text>
          </Box>
        </Box>
      )}

      {step === 'confirm' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Review your configuration:</Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Provider: <Text color={Colors.AccentGreen}>{selectedProvider.displayName}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              API Key: <Text color={Colors.AccentGreen}>{apiKey.substring(0, 8)}...</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Base URL: <Text color={Colors.AccentGreen}>{baseUrl}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Model: <Text color={Colors.AccentGreen}>{model}</Text>
            </Text>
          </Box>
          <Box marginTop={1} marginBottom={1}>
            <Text>Press Enter to save, Ctrl+C to cancel</Text>
          </Box>
          <TextInput
            value=""
            onChange={() => {}}
            onSubmit={handleConfirm}
            placeholder="Press Enter to confirm..."
          />
        </Box>
      )}

      {step === 'complete' && selectedProvider && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={Colors.AccentGreen}>✅ Configuration saved successfully!</Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Provider: <Text color={Colors.AccentGreen}>{selectedProvider.displayName}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Model: <Text color={Colors.AccentGreen}>{model}</Text>
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={Colors.AccentYellow}>
              📝 To persist your API key across sessions, add it to:
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={Colors.Gray}>
              • Your shell profile (~/.bashrc, ~/.zshrc, etc.)
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={Colors.Gray}>• Or ~/.blackboxcli/.env</Text>
          </Box>
          <Box marginTop={1} marginLeft={2}>
            <Text color={Colors.Gray}>
              export {selectedProvider.envKeyName}=&apos;{apiKey.substring(0, 8)}...&apos;
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={Colors.AccentCyan}>
              💡 Run &apos;blackbox&apos; to start using the CLI!
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
