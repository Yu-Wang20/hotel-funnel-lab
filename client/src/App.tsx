import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import HotelList from "./pages/HotelList";
import HotelDetail from "./pages/HotelDetail";
import Booking from "./pages/Booking";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetail from "./pages/OrderDetail";
import Dashboard from "./pages/Dashboard";
import Experiments from "./pages/Experiments";
import Documentation from "./pages/Documentation";
import { TrackingProvider } from "./contexts/TrackingContext";
import { PriceModeProvider } from "./contexts/PriceModeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/hotels" component={HotelList} />
      <Route path="/hotel/:id" component={HotelDetail} />
      <Route path="/booking/:hotelId/:roomId" component={Booking} />
      <Route path="/order/confirmation/:orderNumber" component={OrderConfirmation} />
      <Route path="/order/:orderNumber" component={OrderDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/experiments" component={Experiments} />
      <Route path="/docs" component={Documentation} />
      <Route path="/docs/:section" component={Documentation} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TrackingProvider>
          <PriceModeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </PriceModeProvider>
        </TrackingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
