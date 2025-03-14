import { NavigationContainer } from "@react-navigation/native";
import Navigation from "./Navigation/Navigation.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
